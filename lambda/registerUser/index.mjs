import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, SubscribeCommand, CreateTopicCommand } from "@aws-sdk/client-sns";
import { createHash } from "crypto";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "ap-south-1" }));
const sns = new SNSClient({ region: "ap-south-1" });

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST"
};

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: HEADERS, body: "" };
  }

  try {
    const { email, password, name } = JSON.parse(event.body);

    // --- Validate inputs ---
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "Email, password, and name are required" })
      };
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "Password must be at least 6 characters" })
      };
    }

    // --- Check if user already exists ---
    const existing = await dynamo.send(new GetCommand({
      TableName: "Users",
      Key: { email }
    }));

    if (existing.Item) {
      return {
        statusCode: 409,
        headers: HEADERS,
        body: JSON.stringify({ error: "An account with this email already exists" })
      };
    }

    const passwordHash = hashPassword(password);

    // --- Create SNS topic for THIS user ---
    let topicArn = null;

    try {
      const topicResponse = await sns.send(new CreateTopicCommand({
        Name: `FoodExpiry-${email.replace(/[@.]/g, "-")}`
      }));

      topicArn = topicResponse.TopicArn;

      // --- Subscribe user email to their own topic ---
      await sns.send(new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: "email",
        Endpoint: email
      }));

      console.log(`SNS topic created & subscription sent for ${email}`);

    } catch (snsErr) {
      console.error("SNS setup error (non-fatal):", snsErr);
      // Don't fail registration if SNS fails
    }

    // --- Save user to DynamoDB ---
    await dynamo.send(new PutCommand({
      TableName: "Users",
      Item: {
        email,
        passwordHash,
        name,
        createdAt: new Date().toISOString(),
        topicArn   // 🔥 NEW FIELD (important)
      }
    }));

    return {
      statusCode: 201,
      headers: HEADERS,
      body: JSON.stringify({
        message: "Account created successfully! Please confirm your email subscription.",
        email,
        name
      })
    };

  } catch (error) {
    console.error("Registration error:", error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: "Registration failed. Please try again." })
    };
  }
};