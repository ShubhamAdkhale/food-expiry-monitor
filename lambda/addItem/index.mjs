import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "ap-south-1" }));

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST"
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: HEADERS, body: "" };
  }

  try {
    const { name, expiryDate, category, userEmail, quantity, unit } = JSON.parse(event.body);

    if (!name || !expiryDate || !userEmail) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "name, expiryDate, and userEmail are required" })
      };
    }

    const item = {
      itemId: randomUUID(),
      userEmail,
      name,
      expiryDate,
      category: category || "General",
      quantity: quantity !== undefined && quantity !== "" ? Number(quantity) : null,
      unit: unit || null,
      addedOn: new Date().toISOString()
    };

    await dynamo.send(new PutCommand({ TableName: "FoodItems", Item: item }));

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ message: "Item added successfully", itemId: item.itemId })
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: "Failed to add item" })
    };
  }
};