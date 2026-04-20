import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHash } from "crypto";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "ap-south-1" }));

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
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "Email and password are required" })
      };
    }

    // Look up user in DynamoDB 
    const result = await dynamo.send(new GetCommand({
      TableName: "Users",
      Key: { email }
    }));

    if (!result.Item) {
      return {
        statusCode: 401,
        headers: HEADERS,
        body: JSON.stringify({ error: "Invalid email or password" })
      };
    }

    const user = result.Item;

    const incomingHash = hashPassword(password);
    if (incomingHash !== user.passwordHash) {
      return {
        statusCode: 401,
        headers: HEADERS,
        body: JSON.stringify({ error: "Invalid email or password" })
      };
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        message: "Login successful",
        user: {
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          snsConfirmed: user.snsSubscriptionArn !== "pending" && 
                        !user.snsSubscriptionArn?.includes("pending")
        }
      })
    };

  } catch (error) {
    console.error("Login error:", error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: "Login failed. Please try again." })
    };
  }
};