// checkExpiry Lambda - FINAL (per-user SNS topics)
// Each user gets ONLY their own alerts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: "ap-south-1" })
);

const sns = new SNSClient({ region: "ap-south-1" });

// Parse date as LOCAL (avoid timezone bug)
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Get today's date (no time)
function getTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export const handler = async () => {
  try {
    const today = getTodayLocal();

    // --- Get all items ---
    const itemsResult = await dynamo.send(
      new ScanCommand({ TableName: "FoodItems" })
    );
    const allItems = itemsResult.Items || [];

    // --- Get all users ---
    const usersResult = await dynamo.send(
      new ScanCommand({ TableName: "Users" })
    );
    const allUsers = usersResult.Items || [];

    console.log(`Users: ${allUsers.length}, Items: ${allItems.length}`);

    let alertsSent = 0;
    let skipped = 0;

    // --- Process each user ---
    for (const user of allUsers) {

      // ⚠️ Skip if topicArn missing (important)
      if (!user.topicArn) {
        console.log(`Skipping ${user.email} — no topicArn`);
        skipped++;
        continue;
      }

      // --- Filter user's items ---
      const userAlertItems = allItems
        .filter((item) => {
          if (item.userEmail !== user.email) return false;

          const expiry = parseLocalDate(item.expiryDate);
          const diffTime = expiry.getTime() - today.getTime();
          const daysRemaining = Math.floor(
            diffTime / (1000 * 60 * 60 * 24)
          );

          return daysRemaining <= 3;
        })
        .map((item) => {
          const expiry = parseLocalDate(item.expiryDate);
          const diffTime = expiry.getTime() - today.getTime();
          const daysRemaining = Math.floor(
            diffTime / (1000 * 60 * 60 * 24)
          );

          return { ...item, daysRemaining };
        });

      // --- Skip if nothing to alert ---
      if (userAlertItems.length === 0) {
        console.log(`No alerts for ${user.email}`);
        continue;
      }

      // --- Build message ---
      let message = `Hi ${user.name},\n\n`;
      message += `Here is your daily food expiry report:\n\n`;

      userAlertItems.forEach((item) => {
        const qtyStr =
          item.quantity != null && item.unit
            ? ` [${item.quantity} ${item.unit}]`
            : item.quantity != null
            ? ` [${item.quantity}]`
            : "";

        if (item.daysRemaining < 0) {
          message += `❌ ${item.name}${qtyStr} (${item.category}) — EXPIRED ${Math.abs(
            item.daysRemaining
          )} day(s) ago\n`;
        } else if (item.daysRemaining === 0) {
          message += `⚠️ ${item.name}${qtyStr} (${item.category}) — Expires TODAY!\n`;
        } else {
          message += `⏰ ${item.name}${qtyStr} (${item.category}) — Expires in ${
            item.daysRemaining
          } day(s) on ${item.expiryDate}\n`;
        }
      });

      message += `\n---\nTotal items needing attention: ${userAlertItems.length}\n`;
      message += `Log in to your Food Expiry Monitor to take action.\n`;
      message += `\nThis is your automated daily alert.`;

      // ✅ Send ONLY to this user's topic
      await sns.send(
        new PublishCommand({
          TopicArn: user.topicArn,
          Subject: `🥗 Food Expiry Alert — ${userAlertItems.length} item(s)`,
          Message: message,
        })
      );

      alertsSent++;
      console.log(`Alert sent to ${user.email}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Expiry check complete",
        alertsSent,
        skipped,
        totalUsers: allUsers.length,
      }),
    };

  } catch (error) {
    console.error("checkExpiry error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Expiry check failed" }),
    };
  }
};