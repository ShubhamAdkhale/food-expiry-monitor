# Food Expiry Monitor (Serverless AWS Project)

A full-stack, serverless web application that helps users track food expiry dates and receive daily email alerts before items expire.

Users can register, log in, and manage their own private inventory of food items. The backend runs entirely on AWS managed services (Lambda, API Gateway, DynamoDB, SNS, EventBridge), so there is no traditional always-on server to maintain.

---

## Architecture Overview

This project follows a serverless, event-driven architecture:

![AWS Serverless Architecture Diagram](frontend/Architecture_Diagram/Architecture_CCL.png)

1. **User registers / logs in (Frontend → API Gateway → Lambda)**
	 - Registration stores the user in DynamoDB.
	 - A dedicated SNS topic is created per user for private notifications.
	 - The user is subscribed to that topic via email (SNS sends a confirmation email).

2. **User manages inventory (Frontend → API Gateway → Lambda → DynamoDB)**
	 - Food items are stored in DynamoDB under the logged-in user.
	 - Each item’s status is derived from its expiry date:
		 - **Expired**: already past
		 - **Expiring soon**: within the next few days
		 - **Fresh**: more than a few days away

3. **Daily automated alerts (EventBridge → checkExpiry Lambda → SNS → Email)**
	 - EventBridge runs on a schedule (daily).
	 - The scheduled Lambda checks each user’s items.
	 - If any items are expiring soon/expired, the Lambda publishes a personalized message to that user’s SNS topic.
	 - SNS sends the email alert.

**Why per-user SNS topics?**
- It keeps notifications private and scoped to a single user.
- It makes it easy to publish personalized alerts without mixing recipients.

---

## Tech Stack

**Frontend**
- React.js

**Backend (Serverless)**
- AWS Lambda (Node.js)
- AWS API Gateway
- AWS DynamoDB (Users + FoodItems tables)
- AWS SNS (per-user topics)
- AWS EventBridge (daily scheduler)
- AWS IAM (least-privilege permissions)

---

## Features

- User Registration & Login (custom auth using Lambda + DynamoDB)
- Add and view food items (per-user inventory)
- Expiry tracking with intelligent status:
	- Expired
	- Expiring soon
	- Fresh
- Daily automated email alerts using SNS
- Per-user notification system (each user has a dedicated SNS topic)
- Fully serverless architecture (no traditional backend server)

---

## Folder Structure

Below is a clean monorepo-style structure (you can adapt it to your setup):

```
food-expiry-monitor/
	frontend/
		public/
		src/
		package.json
	lambda/                     
	    registerUser/
	      index.mjs
	    loginUser/
	      index.mjs
	    addItem/
	      index.mjs
	    getItems/
	      index.mjs
	    checkExpiry/
	      index.mjs
	README.md
```

---

## Setup Instructions

### Prerequisites

- AWS account
- Node.js (LTS recommended)
- VS Code

Optional (recommended for deployment automation):
- AWS CLI configured with an IAM user/role
- An IaC tool (AWS SAM / Serverless Framework / CDK)

---

### Backend Setup (AWS)

You can set this up through the AWS Console, or automate it using IaC.

#### 1) DynamoDB

Create two tables:

- **Users** table
	- Partition key: `email` (String)
	- Suggested attributes: `name`, `passwordHash` (recommended), `snsTopicArn`, `snsConfirmed`

- **FoodItems** table
	- Recommended keys:
		- Partition key: `userEmail` (String)
		- Sort key: `itemId` (String)
	- Suggested attributes: `name`, `category`, `expiryDate`, `quantity`, `unit`, `createdAt`

Note: If your implementation uses a different key schema, update the Lambdas accordingly.

#### 2) SNS (Per-user topics)

- Registration Lambda should:
	- Create an SNS topic for the user (example naming: `food-expiry-{userId}`)
	- Subscribe the user’s email to that topic
	- Store `snsTopicArn` in the user record

Important: **SNS email subscriptions require confirmation.** Users must click the “Confirm subscription” link in the SNS email before alerts can be delivered.

#### 3) Lambda Functions

Create Lambda functions (Node.js runtime), such as:

- Auth
	- `register` (creates user + SNS topic/subscription)
	- `login` (validates credentials)

- Items
	- `createItem` (adds a food item)
	- `listItems` (returns the user’s items)

- Scheduler
	- `checkExpiry` (daily expiry scan + SNS publish)

Ensure each Lambda has environment variables for table names and region.

#### 4) API Gateway

Create an API and map routes to Lambda integrations.

Typical endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /items?userEmail=...`
- `POST /items`

Enable CORS so the React app can call your API from the browser.

#### 5) EventBridge Schedule (Daily Job)

- Create an EventBridge rule on a daily cron/rate schedule
- Target: `checkExpiry` Lambda
- Choose a schedule time that makes sense for your users (and document the timezone)

#### 6) IAM Permissions

Follow least-privilege permissions. Typical permissions needed:

- DynamoDB: `GetItem`, `PutItem`, `UpdateItem`, `Query`, `Scan` (scan only if required)
- SNS: `CreateTopic`, `Subscribe`, `Publish`
- Logs: CloudWatch Logs permissions for Lambda execution

---

### Frontend Setup (React)

From the frontend directory (or project root if your React app lives at the root):

1. Install dependencies
	 - `npm install`

2. Configure the API base URL
	 - Set your API Gateway base URL in the frontend configuration.
	 - This project uses a constant named `API_URL` in the React app. Update it to your deployed API URL.

3. Start the development server
	 - `npm start`

4. Build for production
	 - `npm run build`

---

## Environment Configuration

### Frontend

- **API base URL** (API Gateway)
	- Example: `https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod`

Recommended improvement (optional): move config into a `.env` file so you don’t hardcode URLs:

```
REACT_APP_API_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod
```

### Backend (Lambda environment variables)

Typical environment variables:

- `AWS_REGION`
- `USERS_TABLE`
- `FOOD_ITEMS_TABLE`

If you store SNS topic ARNs per user:

- `SNS_TOPIC_PREFIX` (optional, depending on implementation)

---

## How It Works (Step-by-Step)

1. **Register**
	 - User submits name, email, password
	 - Backend creates a user record in DynamoDB
	 - Backend creates an SNS topic for the user and subscribes the user’s email
	 - SNS sends a confirmation email (user must confirm)

2. **Login**
	 - User logs in with email and password
	 - Backend validates credentials and returns the user profile

3. **Add Item**
	 - User adds item name, category, expiry date (and optionally quantity/unit)
	 - Backend writes the item to DynamoDB under that user

4. **View Dashboard**
	 - Frontend fetches the user’s items
	 - Item status is calculated from expiry date:
		 - Expired (daysRemaining < 0)
		 - Expiring soon (0–3 days)
		 - Fresh (> 3 days)

5. **Daily Alert**
	 - EventBridge triggers `checkExpiry` once per day
	 - Lambda checks items and prepares a personalized alert message
	 - Lambda publishes to the user’s SNS topic
	 - SNS emails the user (if subscription is confirmed)

---

## Future Enhancements

- Password reset / email verification flows
- Better authentication hardening (token-based sessions, refresh tokens, stronger password policies)
- Replace custom auth with AWS Cognito (optional)
- Item edit/delete, bulk import/export (CSV)
- Push notifications (mobile) or multi-channel alerts (SMS)
- Barcode scanning and smart suggestions for item names/categories
- Multi-timezone scheduling for alerts
- Infrastructure-as-Code templates (SAM/CDK) for one-command deployment

