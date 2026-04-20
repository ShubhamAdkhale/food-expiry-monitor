import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "ap-south-1" }));

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,GET"
};

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // This creates a date in local timezone
  return date;
}

function getTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: HEADERS, body: "" };
  }

  try {
    const userEmail = event.queryStringParameters?.userEmail;

    if (!userEmail) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "userEmail query parameter is required" })
      };
    }

    const result = await dynamo.send(new ScanCommand({
      TableName: "FoodItems",
      FilterExpression: "userEmail = :email",
      ExpressionAttributeValues: {
        ":email": userEmail
      }
    }));

    const today = getTodayLocal();

    const items = result.Items.map(item => {
      const expiry = parseLocalDate(item.expiryDate);
      
      const diffTime = expiry.getTime() - today.getTime();
      const daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let status;
      if (daysRemaining < 0)       status = "expired";
      else if (daysRemaining <= 3) status = "expiring-soon";
      else                         status = "fresh";

      return { ...item, daysRemaining, status };
    });

    items.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify(items)
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: "Failed to fetch items" })
    };
  }
};