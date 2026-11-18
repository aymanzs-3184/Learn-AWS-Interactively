import { CertificationTrack, LabMeta, MentalModelItem, QuizDeck } from '../types/aws';

export const LABS: LabMeta[] = [
  {
    id: 'iam-policy',
    number: '01',
    title: 'IAM Least-Privilege Policy Builder',
    category: 'Identity & Security',
    duration: '12 min',
    difficulty: 'Foundational',
    devAnalogy: 'RBAC / OAuth Scopes for your cloud API calls',
    summary:
      'Build a scoped IAM JSON policy for a backend service reading invoices from S3, then test real API actions in the policy simulator.',
    objectives: [
      'Replace wildcard admin permissions with explicit S3 object actions',
      'Scope the Resource ARN strictly to arn:aws:s3:::dev-app-invoices/*',
      'Verify PutObject and DeleteBucket are blocked while GetObject succeeds',
    ],
    sdkPackage: '@aws-sdk/client-iam',
    cliSnippet: `aws iam create-policy \\
  --policy-name InvoiceReaderPolicy \\
  --policy-document file://invoice-policy.json

aws iam simulate-principal-policy \\
  --policy-source-arn arn:aws:iam::123456789012:role/AppBackendRole \\
  --action-names s3:GetObject s3:DeleteBucket \\
  --resource-arns arn:aws:s3:::dev-app-invoices/inv-01.pdf`,
    sdkSnippet: `import { IAMClient, SimulatePrincipalPolicyCommand } from "@aws-sdk/client-iam";

const iam = new IAMClient({ region: "us-east-1" });
const res = await iam.send(new SimulatePrincipalPolicyCommand({
  PolicySourceArn: "arn:aws:iam::123456789012:role/AppBackendRole",
  ActionNames: ["s3:GetObject", "s3:DeleteBucket"],
  ResourceArns: ["arn:aws:s3:::dev-app-invoices/inv-01.pdf"]
}));`,
  },
  {
    id: 's3-static-cors',
    number: '02',
    title: 'S3 Static Hosting & CORS Troubleshooter',
    category: 'Storage & Delivery',
    duration: '15 min',
    difficulty: 'Foundational',
    devAnalogy: 'Object storage + Nginx static server + Access-Control-Allow-Origin',
    summary:
      'Diagnose 403 Forbidden and browser CORS errors when hosting a frontend SPA and serving assets from Amazon S3.',
    objectives: [
      'Configure Block Public Access or CloudFront OAC safely',
      'Enable static website routing with index.html and SPA fallback',
      'Add a CORS rule allowing GET/HEAD from https://app.cloudbench.dev',
    ],
    sdkPackage: '@aws-sdk/client-s3',
    cliSnippet: `aws s3 sync ./dist s3://dev-spa-assets --delete

aws s3api put-bucket-cors \\
  --bucket dev-spa-assets \\
  --cors-configuration file://cors.json`,
    sdkSnippet: `import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });
await s3.send(new PutBucketCorsCommand({
  Bucket: "dev-spa-assets",
  CORSConfiguration: {
    CORSRules: [{
      AllowedOrigins: ["https://app.cloudbench.dev"],
      AllowedMethods: ["GET", "HEAD"],
      AllowedHeaders: ["*"]
    }]
  }
}));`,
  },
  {
    id: 'serverless-api',
    number: '03',
    title: 'Serverless API: API Gateway + Lambda + DynamoDB',
    category: 'Serverless Compute',
    duration: '18 min',
    difficulty: 'Intermediate',
    devAnalogy: 'Express.js route handler + Redis/Mongo key-value store',
    summary:
      'Wire an HTTP API endpoint to a Node.js Lambda handler backed by DynamoDB, tune memory and timeouts, and trace cold vs warm invocations.',
    objectives: [
      'Attach POST /orders route integration to the Lambda function',
      'Grant the Lambda execution role dynamodb:PutItem permission',
      'Configure DynamoDB partition key orderId and run a live test request',
    ],
    sdkPackage: '@aws-sdk/client-dynamodb',
    cliSnippet: `aws lambda update-function-configuration \\
  --function-name create-order \\
  --memory-size 512 \\
  --timeout 10

aws dynamodb put-item \\
  --table-name Orders \\
  --item '{"orderId":{"S":"ord_1024"},"totalCents":{"N":"4900"}}'`,
    sdkSnippet: `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const handler = async (event: { body: string }) => {
  const payload = JSON.parse(event.body);
  await doc.send(new PutCommand({ TableName: "Orders", Item: payload }));
  return { statusCode: 201, body: JSON.stringify({ saved: true }) };
};`,
  },
  {
    id: 'vpc-networking',
    number: '04',
    title: 'VPC Subnets, Route Tables & Security Groups',
    category: 'Networking',
    duration: '16 min',
    difficulty: 'Intermediate',
    devAnalogy: 'Private LAN vs DMZ + stateful firewall rules around Postgres',
    summary:
      'Fix a production timeout between an app server and RDS Postgres while ensuring the database port 5432 stays unreachable from the public internet.',
    objectives: [
      'Route public subnet traffic (0.0.0.0/0) through the Internet Gateway',
      'Allow HTTPS (443) inbound on the Web Security Group from 0.0.0.0/0',
      'Allow PostgreSQL (5432) inbound on the RDS Security Group only from sg-web',
    ],
    sdkPackage: '@aws-sdk/client-ec2',
    cliSnippet: `aws ec2 create-route \\
  --route-table-id rtb-public \\
  --destination-cidr-block 0.0.0.0/0 \\
  --gateway-id igw-09a8b7c6

aws ec2 authorize-security-group-ingress \\
  --group-id sg-rds-db \\
  --protocol tcp --port 5432 --source-group sg-web`,
    sdkSnippet: `import { EC2Client, AuthorizeSecurityGroupIngressCommand } from "@aws-sdk/client-ec2";

const ec2 = new EC2Client({ region: "us-east-1" });
await ec2.send(new AuthorizeSecurityGroupIngressCommand({
  GroupId: "sg-rds-db",
  IpPermissions: [{
    IpProtocol: "tcp",
    FromPort: 5432,
    ToPort: 5432,
    UserIdGroupPairs: [{ GroupId: "sg-web" }]
  }]
}));`,
  },
  {
    id: 'compute-sizing',
    number: '05',
    title: 'EC2 vs Fargate vs Lambda Cost & Sizing',
    category: 'Compute & Architecture',
    duration: '10 min',
    difficulty: 'Foundational',
    devAnalogy: 'Choosing between a dedicated VM, managed Docker containers, or FaaS',
    summary:
      'Simulate real request rates, execution durations, and WebSocket requirements to pick the optimal compute service and minimize monthly cloud spend.',
    objectives: [
      'Explore monthly cost crossover points between Lambda and Fargate',
      'Identify cold-start and timeout limits (15-min max on Lambda)',
      'Solve 3 real-world developer deployment scenarios',
    ],
    sdkPackage: '@aws-sdk/client-lambda',
    cliSnippet: `aws ecs create-service \\
  --cluster prod-cluster \\
  --service-name api-worker \\
  --launch-type FARGATE \\
  --desired-count 2`,
    sdkSnippet: `import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({ region: "us-east-1" });
const out = await lambda.send(new InvokeCommand({
  FunctionName: "resize-thumbnail",
  Payload: Buffer.from(JSON.stringify({ key: "uploads/avatar.png" }))
}));`,
  },
];

export const MENTAL_MODELS: MentalModelItem[] = [
  {
    id: 'mm-ec2',
    category: 'compute',
    devConcept: 'Linux VPS / Bare Virtual Machine',
    devContext: 'Renting an Ubuntu server with SSH access where you manage OS patches and systemd.',
    awsService: 'Amazon EC2',
    awsCode: 'aws ec2 run-instances --instance-type t3.micro',
    whenToUse: 'Legacy apps, custom kernel modules, predictable 24/7 workloads with Reserved Instances.',
    gotcha: 'You pay per second while running even at 0% CPU, and you are responsible for OS security patches.',
    relatedLabId: 'compute-sizing',
  },
  {
    id: 'mm-lambda',
    category: 'compute',
    devConcept: 'Single Express Route / Async Function',
    devContext: 'Exporting an async handler(req) without provisioning or patching any server.',
    awsService: 'AWS Lambda',
    awsCode: 'export const handler = async (event) => ({ statusCode: 200 })',
    whenToUse: 'Event-driven APIs, webhooks, S3 file processing, and spiky traffic with idle periods.',
    gotcha: 'Max execution timeout is 15 minutes; infrequent calls can experience 100–800ms cold starts.',
    relatedLabId: 'serverless-api',
  },
  {
    id: 'mm-fargate',
    category: 'compute',
    devConcept: 'Managed Docker Compose / Kubernetes Pods',
    devContext: 'Running your Dockerfile without managing the underlying EC2 worker nodes.',
    awsService: 'Amazon ECS + AWS Fargate',
    awsCode: 'launchType: "FARGATE", cpu: "512", memory: "1024"',
    whenToUse: 'Long-running microservices, WebSockets, GraphQL servers, or jobs exceeding 15 minutes.',
    gotcha: 'Costs slightly more per vCPU-hour than self-managed EC2, but eliminates cluster patching.',
    relatedLabId: 'compute-sizing',
  },
  {
    id: 'mm-s3',
    category: 'storage',
    devConcept: 'Unlimited Cloud File Bucket (Key -> Blob)',
    devContext: 'Storing user uploads, build artifacts, backups, and static SPAs outside your app server.',
    awsService: 'Amazon S3',
    awsCode: 's3.send(new PutObjectCommand({ Bucket, Key, Body }))',
    whenToUse: 'Images, videos, logs, static React/Vite bundles, and data lakes.',
    gotcha: 'Buckets are flat key-value stores (folders are just key prefixes), and bucket names are globally unique.',
    relatedLabId: 's3-static-cors',
  },
  {
    id: 'mm-rds',
    category: 'storage',
    devConcept: 'Managed PostgreSQL / MySQL Server',
    devContext: 'Running Postgres with automated backups, Multi-AZ failover, and zero manual replication setup.',
    awsService: 'Amazon RDS / Aurora',
    awsCode: 'postgres://appuser@mydb.abc123.us-east-1.rds.amazonaws.com:5432',
    whenToUse: 'Relational schemas, ACID transactions, JOINs, and ORMs like Prisma or Drizzle.',
    gotcha: 'RDS lives inside your VPC; if you forget Security Group rules, connections silently time out.',
    relatedLabId: 'vpc-networking',
  },
  {
    id: 'mm-dynamodb',
    category: 'storage',
    devConcept: 'Serverless Redis / MongoDB Key-Value',
    devContext: 'Single-digit millisecond NoSQL table accessed over HTTPS—no connection pools needed.',
    awsService: 'Amazon DynamoDB',
    awsCode: 'doc.send(new GetCommand({ TableName: "Users", Key: { userId } }))',
    whenToUse: 'Lambda backends (avoids Postgres connection exhaustion), session stores, high-scale lookups.',
    gotcha: 'No arbitrary JOINs; you must design partition and sort keys around your exact query patterns.',
    relatedLabId: 'serverless-api',
  },
  {
    id: 'mm-vpc',
    category: 'networking',
    devConcept: 'Private Office LAN + Firewall + Router',
    devContext: 'Isolating internal databases from the public internet while exposing only port 443.',
    awsService: 'Amazon VPC & Security Groups',
    awsCode: 'sg-rds inbound: TCP 5432 from sg-app-server',
    whenToUse: 'Every production EC2, ECS, or RDS deployment.',
    gotcha: 'Security Groups are stateful (return traffic is auto-allowed); Network ACLs are stateless.',
    relatedLabId: 'vpc-networking',
  },
  {
    id: 'mm-cloudfront',
    category: 'networking',
    devConcept: 'Global Edge Reverse Proxy / CDN',
    devContext: 'Caching static assets at 400+ edge locations and terminating TLS close to users.',
    awsService: 'Amazon CloudFront',
    awsCode: 'Origin: S3 Bucket via Origin Access Control (OAC)',
    whenToUse: 'Serving React builds globally, lowering S3 egress cost, adding custom HTTPS domains.',
    gotcha: 'After deploying new files to S3, create a CloudFront invalidation (/*) or use hashed filenames.',
    relatedLabId: 's3-static-cors',
  },
  {
    id: 'mm-iam',
    category: 'security',
    devConcept: 'Service Account Roles & Scoped API Tokens',
    devContext: 'Replacing hardcoded AWS_ACCESS_KEY_ID in .env files with temporary short-lived role credentials.',
    awsService: 'AWS IAM (Roles & Policies)',
    awsCode: 'Effect: "Allow", Action: "s3:GetObject", Resource: "arn:..."',
    whenToUse: 'Every AWS service-to-service interaction (Lambda -> DynamoDB, EC2 -> S3).',
    gotcha: 'Never commit IAM Access Keys to Git; attach an IAM Role to your Lambda or EC2 instance instead.',
    relatedLabId: 'iam-policy',
  },
  {
    id: 'mm-secrets',
    category: 'security',
    devConcept: 'Managed Encrypted .env Vault',
    devContext: 'Storing Stripe keys, DB passwords, and JWT secrets with KMS encryption and auto-rotation.',
    awsService: 'Secrets Manager / SSM Parameter Store',
    awsCode: 'aws ssm get-parameter --name /prod/db/url --with-decryption',
    whenToUse: 'Injecting runtime secrets into ECS tasks, Lambda functions, or CI/CD pipelines.',
    gotcha: 'SSM Parameter Store Standard tier is free for config strings; Secrets Manager ($0.40/secret/mo) adds built-in RDS password rotation.',
    relatedLabId: 'iam-policy',
  },
];

export const QUIZ_DECKS: QuizDeck[] = [
  {
    id: 'iam-security',
    title: 'IAM, Credentials & Shared Responsibility',
    category: 'Security',
    difficulty: 'Beginner',
    estimatedMinutes: 6,
    description:
      'Master IAM Roles vs Users, policy evaluation order (Explicit Deny wins), and avoiding leaked API keys.',
    questions: [
      {
        id: 'iam-q1',
        domain: 'Security & Compliance',
        prompt:
          'Your Node.js app runs on an EC2 instance and needs to upload user avatars to an S3 bucket. What is the AWS security best practice for authenticating those S3 SDK calls?',
        options: [
          'Store an IAM User AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in a .env file on the EC2 instance',
          'Attach an IAM Role with s3:PutObject permission directly to the EC2 instance profile',
          'Use the AWS account root user credentials inside the EC2 environment variables',
          'Make the S3 bucket publicly writable so no credentials are needed',
        ],
        correctIndex: 1,
        explanation:
          'Attaching an IAM Role (Instance Profile) provides automatic, short-lived temporary credentials via the Instance Metadata Service (IMDSv2) that rotate automatically and never live on disk.',
        distractorNote:
          'Static IAM User keys on EC2 instances can leak via logs or snapshots. Root credentials should never be used for application workloads.',
      },
      {
        id: 'iam-q2',
        domain: 'Security & Compliance',
        prompt:
          'An IAM developer belongs to GroupA (which has an Allow policy for s3:*) and also has an inline policy attached directly to their user that explicitly Denies s3:DeleteObject. What happens when they call s3:DeleteObject?',
        options: [
          'The call succeeds because GroupA grants s3:*',
          'The call is Denied because an Explicit Deny always overrides any Allow',
          'AWS prompts for MFA before allowing the deletion',
          'The inline policy is ignored when a group policy exists',
        ],
        correctIndex: 1,
        explanation:
          'AWS IAM policy evaluation follows three strict rules: Default Deny -> Explicit Allow -> Explicit Deny. Any Explicit Deny anywhere in attached policies, permission boundaries, or SCPs always wins.',
        distractorNote:
          'A very common exam trap is assuming more specific Allow overrides Deny or vice versa—Explicit Deny is absolute.',
      },
      {
        id: 'iam-q3',
        domain: 'Security & Compliance',
        prompt:
          'Under the AWS Shared Responsibility Model, which task is ALWAYS the customer’s (your team’s) responsibility when running a custom API on Amazon EC2?',
        options: [
          'Replacing failed physical hard drives in the AWS data center',
          'Patching the guest Linux operating system and securing your application code',
          'Maintaining biometric locks on the AWS region facility',
          'Patching the underlying Nitro hypervisor firmware',
        ],
        correctIndex: 1,
        explanation:
          'AWS manages security OF the cloud (hardware, facilities, hypervisor). Customers manage security IN the cloud—including guest OS updates on EC2, IAM policies, Security Groups, and application code.',
        distractorNote:
          'Note that for managed services like RDS or Lambda, AWS takes over OS patching too—so read the question carefully to spot EC2 vs Lambda/RDS.',
      },
      {
        id: 'iam-q4',
        domain: 'Security & Compliance',
        prompt:
          'You want to store third-party Stripe webhook secrets and have an RDS database password automatically rotate every 30 days. Which service fits best?',
        options: [
          'AWS Secrets Manager',
          'Amazon S3 Standard',
          'AWS CloudTrail',
          'Amazon Inspector',
        ],
        correctIndex: 0,
        explanation:
          'AWS Secrets Manager integrates natively with Amazon RDS to automatically rotate database credentials on a schedule without downtime.',
        distractorNote:
          'SSM Parameter Store also stores encrypted strings (often free for standard parameters), but lacks built-in turnkey RDS password rotation.',
      },
      {
        id: 'iam-q5',
        domain: 'Security & Compliance',
        prompt:
          'Which AWS service records an audit log of every IAM, S3, and EC2 API call made across your AWS account ("who did what, when, and from which IP")?',
        options: [
          'Amazon CloudWatch Metrics',
          'AWS CloudTrail',
          'AWS Config',
          'Amazon GuardDuty',
        ],
        correctIndex: 1,
        explanation:
          'CloudTrail records AWS API call history and governance events. CloudWatch monitors performance metrics and application logs; AWS Config tracks resource configuration drift.',
        distractorNote:
          'Exam shorthand: CloudTrail = API Audit Trail ("who called DeleteBucket?"); CloudWatch = Metrics & Logs ("CPU at 90%").',
      },
      {
        id: 'iam-q6',
        domain: 'Security & Compliance',
        prompt:
          'Why does the AWS TypeScript SDK v3 work inside AWS Lambda without passing accessKeyId or secretAccessKey in the client constructor?',
        codeContext: 'const s3 = new S3Client({ region: "us-east-1" });',
        options: [
          'Lambda functions bypass IAM checks inside the same AWS region',
          'The SDK automatically loads temporary STS credentials injected from the Lambda execution role',
          'S3Client reads your local ~/.aws/credentials file packaged inside the Lambda zip',
          'AWS disables authentication for SDK v3 clients by default',
        ],
        correctIndex: 1,
        explanation:
          'The AWS SDK default credential provider chain automatically picks up AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SESSION_TOKEN environment variables injected at runtime by the Lambda execution role.',
        distractorNote:
          'Never package ~/.aws/credentials into a deployment zip! Temporary STS credentials are injected dynamically by the runtime.',
      },
    ],
  },
  {
    id: 'compute-serverless',
    title: 'Compute: EC2, Lambda, ECS & Scaling',
    category: 'Compute',
    difficulty: 'Developer Associate',
    estimatedMinutes: 7,
    description:
      'Compare Lambda, Fargate, and EC2 pricing/limits, cold starts, SQS decoupling, and Auto Scaling.',
    questions: [
      {
        id: 'cmp-q1',
        domain: 'Development with AWS',
        prompt:
          'A developer needs to run a video transcoding job that regularly takes 45 minutes per video file. Why will a single AWS Lambda function fail for this task?',
        options: [
          'Lambda cannot read files stored in Amazon S3',
          'Lambda has a hard maximum execution timeout of 15 minutes per invocation',
          'Lambda only supports Python and cannot run binary tools like ffmpeg',
          'Lambda limits payload storage to 1 MB even in /tmp',
        ],
        correctIndex: 1,
        explanation:
          'AWS Lambda has a strict maximum execution duration of 15 minutes (900 seconds). Long-running batch jobs belong on ECS Fargate, AWS Batch, or EC2.',
        distractorNote:
          'Lambda actually supports custom container images, Lambda Layers (for ffmpeg), and up to 10 GB of ephemeral /tmp storage—the 15-minute timeout is the hard blocker.',
      },
      {
        id: 'cmp-q2',
        domain: 'Development with AWS',
        prompt:
          'Your Lambda function initializes a PostgreSQL connection pool inside the handler function instead of outside it. What happens during high traffic?',
        codeContext: `export const handler = async (event) => {\n  const pool = new Pool({ ... }); // Created inside handler!\n  ...\n};`,
        options: [
          'Nothing changes; AWS automatically hoists variables out of the handler',
          'A new database connection is created on every single invocation, slowing down requests and risking connection exhaustion',
          'Lambda throws a syntax error at deploy time',
          'The connection pool is shared across different AWS accounts',
        ],
        correctIndex: 1,
        explanation:
          'Code outside the handler runs once per execution environment initialization (cold start) and is reused across warm invocations. Creating DB clients inside the handler wastes latency and opens redundant connections.',
        distractorNote:
          'Always initialize SDK clients (S3Client, DynamoDBDocumentClient) and connection pools at module scope outside `handler`.',
      },
      {
        id: 'cmp-q3',
        domain: 'Architecture & Scaling',
        prompt:
          'An API receives sudden bursts of 5,000 checkout requests/minute that overwhelm a downstream legacy payment service capable of 100 requests/second. What AWS pattern prevents dropped requests?',
        options: [
          'Place an Amazon SQS queue between API Gateway/Lambda and the worker service to buffer messages',
          'Increase the Lambda timeout from 3 seconds to 15 minutes',
          'Switch from DynamoDB to Amazon S3 Glacier',
          'Disable CloudWatch Logs to speed up HTTP responses',
        ],
        correctIndex: 0,
        explanation:
          'Queue-based load leveling with Amazon SQS decouples producers from consumers, absorbing traffic spikes so workers process messages at a steady, safe concurrency.',
        distractorNote:
          'Increasing Lambda timeout makes slow failures hold concurrency longer and can actually worsen cascading outages.',
      },
      {
        id: 'cmp-q4',
        domain: 'Compute',
        prompt:
          'Which Amazon EC2 purchasing option offers up to 90% cost savings for stateless, fault-tolerant batch workloads that can handle 2-minute interruption notices?',
        options: [
          'On-Demand Instances',
          'EC2 Spot Instances',
          'Dedicated Hosts',
          '1-Year All Upfront Convertible Reserved Instances',
        ],
        correctIndex: 1,
        explanation:
          'EC2 Spot Instances let you bid on spare EC2 capacity at steep discounts (up to 90% off On-Demand), ideal for CI/CD runners, rendering, and stateless worker queues.',
        distractorNote:
          'Reserved Instances and Savings Plans are for steady-state 24/7 production workloads where interruption is unacceptable.',
      },
      {
        id: 'cmp-q5',
        domain: 'Compute',
        prompt:
          'You want to deploy a containerized Node.js WebSocket server using Docker without provisioning, patching, or scaling underlying EC2 virtual machines. Which service should you choose?',
        options: [
          'Amazon ECS with AWS Fargate launch type',
          'Amazon EC2 Auto Scaling Group',
          'Amazon S3 Static Website Hosting',
          'AWS Lambda with S3 Event Notifications',
        ],
        correctIndex: 0,
        explanation:
          'AWS Fargate is a serverless compute engine for containers (ECS and EKS) that runs Docker tasks directly without managing EC2 instances.',
        distractorNote:
          'Standard S3 static hosting has no compute runtime, and Lambda is stateless/request-driven rather than holding long-lived raw TCP/Docker processes.',
      },
    ],
  },
  {
    id: 'storage-databases',
    title: 'Storage & Databases: S3, RDS & DynamoDB',
    category: 'Data & Storage',
    difficulty: 'Developer Associate',
    estimatedMinutes: 7,
    description:
      'Choose between S3 storage classes, EBS vs EFS, RDS Multi-AZ vs Read Replicas, and DynamoDB keys.',
    questions: [
      {
        id: 'db-q1',
        domain: 'Data & Storage',
        prompt:
          'Your team wants high availability (automatic failover within ~60 seconds if a data center loses power) for an Amazon RDS PostgreSQL database. Which feature provides this?',
        options: [
          'RDS Read Replicas in the same Availability Zone',
          'RDS Multi-AZ deployment with synchronous standby replication',
          'Taking manual snapshots every 24 hours',
          'Enabling S3 Transfer Acceleration',
        ],
        correctIndex: 1,
        explanation:
          'RDS Multi-AZ synchronously replicates data to a standby instance in a different Availability Zone and automatically updates DNS on failure.',
        distractorNote:
          'Exam classic: Multi-AZ = High Availability / Disaster Recovery (synchronous). Read Replicas = Read Scaling / Performance (asynchronous).',
      },
      {
        id: 'db-q2',
        domain: 'Data & Storage',
        prompt:
          'How should a backend API securely allow a browser user to upload a 500 MB video file directly to a private Amazon S3 bucket without routing the 500 MB payload through your Node.js server?',
        options: [
          'Make the S3 bucket completely public for writes',
          'Generate a short-lived S3 Presigned PUT URL on the backend and return it to the browser',
          'Embed your AWS secret key in the React frontend bundle',
          'Convert the video to Base64 and send it through API Gateway (10 MB payload limit)',
        ],
        correctIndex: 1,
        explanation:
          'S3 Presigned URLs grant temporary, scoped permission (e.g., 5 minutes for one specific object key) so clients upload directly to S3 with zero server bandwidth bottleneck.',
        distractorNote:
          'API Gateway has a 10 MB payload limit and Lambda has a 6 MB synchronous payload limit—direct-to-S3 via Presigned URLs is the canonical pattern.',
      },
      {
        id: 'db-q3',
        domain: 'Data & Storage',
        prompt:
          'Multiple EC2 instances across two Availability Zones need to mount the exact same shared POSIX file system simultaneously to read CMS media files. Which storage service solves this?',
        options: [
          'Amazon EBS (gp3)',
          'Amazon EFS (Elastic File System)',
          'EC2 Instance Store',
          'Amazon S3 Glacier Deep Archive',
        ],
        correctIndex: 1,
        explanation:
          'Amazon EFS is a serverless, elastic NFS file system that can be mounted concurrently by thousands of EC2 instances and ECS tasks across multiple AZs.',
        distractorNote:
          'Standard EBS volumes attach to a single EC2 instance in a single Availability Zone (like a virtual SSD plugged into one machine).',
      },
      {
        id: 'db-q4',
        domain: 'Data & Storage',
        prompt:
          'When designing a DynamoDB table for an e-commerce app that always fetches orders by `customerId` sorted by `createdAt`, what key structure gives the fastest `Query` performance?',
        options: [
          'Partition Key: createdAt, Sort Key: orderId',
          'Partition Key: customerId, Sort Key: createdAt',
          'Scan the entire table with a FilterExpression on customerId',
          'Use an RDS foreign key constraint inside DynamoDB',
        ],
        correctIndex: 1,
        explanation:
          'Using `customerId` as the Partition Key groups all orders for a customer together, and `createdAt` as the Sort Key enables range queries (`BETWEEN`, latest N orders) without scanning.',
        distractorNote:
          'Avoid `Scan` in production—it reads every item in the table and consumes massive read capacity as data grows.',
      },
      {
        id: 'db-q5',
        domain: 'Data & Storage',
        prompt:
          'You store compliance logs in Amazon S3 that are rarely accessed for 90 days, almost never after 1 year, and must be retained for 7 years at minimal cost. Which S3 feature automates moving them to cheaper tiers?',
        options: [
          'S3 Lifecycle Management rules',
          'S3 Cross-Region Replication',
          'S3 Static Website Hosting',
          'S3 Versioning alone',
        ],
        correctIndex: 0,
        explanation:
          'S3 Lifecycle policies automatically transition objects from S3 Standard to Standard-IA, Glacier Instant Retrieval, or Glacier Deep Archive based on object age.',
        distractorNote:
          'Versioning keeps old object revisions (which actually increases storage until expired via lifecycle rules).',
      },
    ],
  },
  {
    id: 'vpc-networking',
    title: 'VPC Networking, Subnets & CloudFront',
    category: 'Networking',
    difficulty: 'Developer Associate',
    estimatedMinutes: 6,
    description:
      'Troubleshoot Security Groups vs NACLs, Public vs Private subnets, NAT Gateways, and DNS routing.',
    questions: [
      {
        id: 'net-q1',
        domain: 'Networking',
        prompt:
          'Your EC2 web server in a public subnet accepts HTTPS traffic on port 443 via its Security Group inbound rule. Do you also need to add an outbound rule on port 443 for the HTTP response to reach the user?',
        options: [
          'Yes, Security Groups require matching inbound and outbound rules for responses',
          'No, Security Groups are stateful—return traffic for allowed inbound requests is automatically permitted',
          'Only if the VPC uses IPv6',
          'Only when using an Application Load Balancer',
        ],
        correctIndex: 1,
        explanation:
          'Security Groups are stateful firewalls: if an inbound request is allowed, the response packet is automatically allowed back out regardless of outbound rules.',
        distractorNote:
          'Network ACLs (subnet-level firewalls) ARE stateless, meaning NACLs require explicit inbound AND outbound ephemeral port (1024-65535) rules.',
      },
      {
        id: 'net-q2',
        domain: 'Networking',
        prompt:
          'A Lambda function inside a VPC private subnet needs to call the public Stripe API (outbound internet) without allowing any inbound connections from the internet. What VPC component enables this?',
        options: [
          'Attach a NAT Gateway in a public subnet and route private subnet 0.0.0.0/0 traffic to it',
          'Assign a public IPv4 address directly to the Lambda function',
          'Route private subnet 0.0.0.0/0 directly to an Internet Gateway',
          'Enable VPC Flow Logs',
        ],
        correctIndex: 0,
        explanation:
          'A NAT Gateway lives in a public subnet (with an Elastic IP and route to an Internet Gateway) and translates outbound traffic from private subnets so private resources stay unreachable from the internet.',
        distractorNote:
          'Routing 0.0.0.0/0 directly to an Internet Gateway makes a subnet public, not private.',
      },
      {
        id: 'net-q3',
        domain: 'Networking',
        prompt:
          'You host a React single-page app in a private S3 bucket and distribute it with Amazon CloudFront. Which modern mechanism lets CloudFront read the private S3 objects securely?',
        options: [
          'Origin Access Control (OAC) paired with an S3 Bucket Policy granting access only to the CloudFront distribution',
          'Making the S3 bucket public-read for everyone on the internet',
          'Hardcoding IAM user keys in CloudFront custom headers',
          'Opening port 80 in an S3 Security Group',
        ],
        correctIndex: 0,
        explanation:
          'Origin Access Control (OAC) authenticates requests from CloudFront to S3 using SigV4 so the S3 bucket can keep Block Public Access enabled.',
        distractorNote:
          'S3 does not use Security Groups (those belong to VPC ENIs like EC2/RDS/Lambda-in-VPC).',
      },
      {
        id: 'net-q4',
        domain: 'Networking',
        prompt:
          'What is the core architectural difference between an Application Load Balancer (ALB) and a Network Load Balancer (NLB)?',
        options: [
          'ALB operates at Layer 7 (HTTP/HTTPS path & host routing); NLB operates at Layer 4 (TCP/UDP, ultra-low latency, static IP)',
          'ALB only routes to EC2 while NLB only routes to S3',
          'NLB automatically terminates SSL certificates without ACM, while ALB cannot',
          'ALB is paid per GB while NLB is completely free',
        ],
        correctIndex: 0,
        explanation:
          'ALB inspects HTTP headers, paths (`/api/*`, `/admin/*`), and routes directly to Lambda or containers. NLB forwards raw TCP/UDP packets at millions of requests/sec with static Elastic IPs.',
        distractorNote:
          'For standard web REST/GraphQL APIs, ALB is almost always the right default.',
      },
    ],
  },
  {
    id: 'clf-mock',
    title: 'Cloud Practitioner (CLF-C02) Mixed Mock',
    category: 'Exam Readiness',
    difficulty: 'Exam Simulation',
    estimatedMinutes: 12,
    description:
      '10 curated cross-domain scenario questions covering Cloud Concepts, Pricing, Security, and Core Services.',
    questions: [
      {
        id: 'clf-q1',
        domain: 'Cloud Concepts',
        prompt:
          'Which pillar of the AWS Well-Architected Framework focuses on avoiding over-provisioned resources, choosing right-sized instances, and analyzing expenditure over time?',
        options: [
          'Operational Excellence',
          'Cost Optimization',
          'Reliability',
          'Performance Efficiency',
        ],
        correctIndex: 1,
        explanation:
          'The Cost Optimization pillar focuses on running systems to deliver business value at the lowest price point using right-sizing, serverless/managed services, and purchasing options.',
        distractorNote:
          'Performance Efficiency focuses on using computing resources efficiently to meet system requirements (e.g., picking Graviton or edge caching).',
      },
      {
        id: 'clf-q2',
        domain: 'Billing & Pricing',
        prompt:
          'A developer wants to receive an automated email alert if their AWS sandbox monthly spend is forecasted to exceed $25. Which service should they configure?',
        options: [
          'AWS Budgets',
          'AWS Trusted Advisor',
          'AWS Pricing Calculator',
          'AWS Artifact',
        ],
        correctIndex: 0,
        explanation:
          'AWS Budgets lets you set custom cost and usage thresholds (both actual and forecasted) and trigger email or SNS alerts before a surprise bill arrives.',
        distractorNote:
          'AWS Pricing Calculator estimates costs BEFORE you build; AWS Budgets monitors and alerts on live account spend.',
      },
      {
        id: 'clf-q3',
        domain: 'Technology & Services',
        prompt:
          'Which statement accurately distinguishes an AWS Region from an Availability Zone (AZ)?',
        options: [
          'An Availability Zone contains multiple Regions separated by oceans',
          'A Region is a geographic area containing multiple physically isolated Availability Zones (data centers) connected by low-latency fiber',
          'IAM users are scoped to a single Availability Zone',
          'Amazon S3 buckets cannot replicate across Regions',
        ],
        correctIndex: 1,
        explanation:
          'Each AWS Region (e.g., us-east-1, eu-west-1) consists of at least 3 isolated Availability Zones with independent power, cooling, and networking.',
        distractorNote:
          'IAM is global (not regional), while EC2, RDS, and S3 buckets are regional resources.',
      },
      {
        id: 'clf-q4',
        domain: 'Technology & Services',
        prompt:
          'Your team wants to define all VPCs, Lambda functions, and DynamoDB tables in version-controlled TypeScript or YAML files rather than clicking manually in the AWS Console. Which AWS services support this?',
        options: [
          'AWS CloudFormation and AWS CDK',
          'AWS CloudTrail and AWS Shield',
          'Amazon Inspector and Amazon Macie',
          'AWS Organizations and AWS Control Tower',
        ],
        correctIndex: 0,
        explanation:
          'AWS CloudFormation (YAML/JSON) and AWS CDK (TypeScript, Python, Go, Java) provide Infrastructure as Code (IaC) so environments can be code-reviewed and reproduced reliably.',
        distractorNote:
          'For serverless projects specifically, AWS SAM builds on top of CloudFormation with concise syntax.',
      },
      {
        id: 'clf-q5',
        domain: 'Security & Compliance',
        prompt:
          'Which AWS service automatically protects all CloudFront distributions and Route 53 DNS endpoints against common Layer 3/4 DDoS attacks at no extra charge?',
        options: [
          'AWS Shield Standard',
          'AWS WAF',
          'Amazon Macie',
          'AWS KMS',
        ],
        correctIndex: 0,
        explanation:
          'AWS Shield Standard is automatically enabled for all AWS customers at zero cost to mitigate volumetric SYN/UDP flood DDoS attacks.',
        distractorNote:
          'AWS WAF (Web Application Firewall) inspects Layer 7 HTTP traffic for SQL injection, XSS, and rate limiting.',
      },
      {
        id: 'clf-q6',
        domain: 'Technology & Services',
        prompt:
          'Where can a developer view compliance reports like AWS SOC 2 Type II or ISO 27001 certifications to provide to an enterprise customer?',
        options: [
          'AWS Artifact',
          'AWS Trusted Advisor',
          'Amazon CloudWatch',
          'AWS Cost Explorer',
        ],
        correctIndex: 0,
        explanation:
          'AWS Artifact is the self-service portal for on-demand access to AWS security and compliance reports and online agreements (like BAA for HIPAA).',
        distractorNote:
          'Trusted Advisor inspects your account for best-practice optimizations (unused EBS volumes, open S3 buckets, MFA on root).',
      },
      {
        id: 'clf-q7',
        domain: 'Billing & Pricing',
        prompt:
          'Which AWS Support plan is the minimum tier that grants access to 24/7 phone/chat support with Cloud Support Engineers and the full set of Trusted Advisor checks?',
        options: [
          'AWS Basic Support',
          'AWS Developer Support',
          'AWS Business Support',
          'AWS Free Tier',
        ],
        correctIndex: 2,
        explanation:
          'Business Support unlocks 24/7 phone, email, and chat access to Cloud Support Engineers (<1 hr response for urgent production issues) plus full Trusted Advisor checks.',
        distractorNote:
          'Developer Support provides business-hours email support; Enterprise Support adds a dedicated Technical Account Manager (TAM).',
      },
      {
        id: 'clf-q8',
        domain: 'Technology & Services',
        prompt:
          'Which service acts as an asynchronous publish/subscribe (pub/sub) fan-out hub capable of delivering a single event to email, SMS, Lambda, and multiple SQS queues simultaneously?',
        options: [
          'Amazon SNS (Simple Notification Service)',
          'Amazon SQS (Simple Queue Service)',
          'Amazon EventBridge Scheduler only',
          'AWS Direct Connect',
        ],
        correctIndex: 0,
        explanation:
          'Amazon SNS is a pub/sub messaging service that pushes one published message to many subscribers in parallel (fan-out pattern).',
        distractorNote:
          'SQS is a point-to-point pull queue where one consumer processes a message; SNS + SQS together create resilient fan-out pipelines.',
      },
    ],
  },
];

export const CERTIFICATIONS: CertificationTrack[] = [
  {
    id: 'clf-c02',
    code: 'CLF-C02',
    title: 'AWS Certified Cloud Practitioner',
    level: 'Foundational',
    recommendedOrder: 1,
    devVerdict: 'Best starting checkpoint if cloud billing, shared responsibility, and core service names are brand new.',
    examFeeUsd: 100,
    durationMinutes: 90,
    questionCount: 65,
    passingScore: 700,
    prepWeeks: '2–3 weeks',
    overview:
      'Validates overall cloud fluency across AWS core services, security fundamentals, pricing models, and the Well-Architected Framework without deep coding or networking drills.',
    keyServices: ['IAM', 'EC2', 'S3', 'RDS', 'Lambda', 'VPC', 'CloudWatch', 'CloudTrail', 'AWS Budgets'],
    domains: [
      { name: 'Cloud Concepts', percentage: 24, focus: 'Cloud value prop, 6 Pillars of Well-Architected Framework, migration strategies' },
      { name: 'Security & Compliance', percentage: 30, focus: 'Shared Responsibility Model, IAM Users/Roles, KMS, CloudTrail, Shield/WAF' },
      { name: 'Cloud Technology & Services', percentage: 34, focus: 'Compute, Storage, Databases, VPC basics, Global Infrastructure' },
      { name: 'Billing, Pricing & Support', percentage: 12, focus: 'On-Demand vs Savings Plans vs Spot, Free Tier, Support tiers, Budgets' },
    ],
    milestones: [
      {
        id: 'clf-m1',
        label: 'Complete IAM Least-Privilege Policy Lab',
        detail: 'Understand IAM Actions, Resources, and Explicit Deny behavior.',
        actionType: 'lab',
        targetId: 'iam-policy',
      },
      {
        id: 'clf-m2',
        label: 'Complete Compute Sizing & Cost Simulator',
        detail: 'Compare On-Demand EC2, Fargate, and Lambda pricing dynamics.',
        actionType: 'lab',
        targetId: 'compute-sizing',
      },
      {
        id: 'clf-m3',
        label: 'Score 80%+ on IAM & Security Quiz',
        detail: 'Verify mastery of the Shared Responsibility Model and CloudTrail vs CloudWatch.',
        actionType: 'quiz',
        targetId: 'iam-security',
      },
      {
        id: 'clf-m4',
        label: 'Pass the CLF-C02 Mixed Mock Quiz',
        detail: 'Practice cross-domain billing, regions, and service selection questions.',
        actionType: 'quiz',
        targetId: 'clf-mock',
      },
    ],
  },
  {
    id: 'dva-c02',
    code: 'DVA-C02',
    title: 'AWS Certified Developer – Associate',
    level: 'Associate',
    recommendedOrder: 2,
    devVerdict: 'Highest-ROI certification for software engineers—focuses directly on SDKs, Serverless, DynamoDB, CI/CD, and debugging.',
    examFeeUsd: 150,
    durationMinutes: 130,
    questionCount: 65,
    passingScore: 720,
    prepWeeks: '6–8 weeks',
    overview:
      'Designed specifically for software developers building and deploying cloud-native applications. Tests Lambda, API Gateway, DynamoDB data modeling, IAM roles for apps, KMS, and CI/CD.',
    keyServices: ['Lambda', 'API Gateway', 'DynamoDB', 'S3 Presigned URLs', 'SQS/SNS', 'SAM/CDK', 'CodePipeline', 'X-Ray', 'Cognito'],
    domains: [
      { name: 'Development with AWS Services', percentage: 32, focus: 'Lambda cold starts/layers, API Gateway, DynamoDB GSIs/LSIs, SQS/SNS, S3 SDK' },
      { name: 'Security', percentage: 26, focus: 'IAM Roles/STS AssumeRole, Cognito Auth, KMS envelope encryption, Secrets Manager' },
      { name: 'Deployment', percentage: 24, focus: 'AWS SAM, CloudFormation, CodeBuild/CodeDeploy blue-green & canary deployments' },
      { name: 'Troubleshooting & Optimization', percentage: 18, focus: 'CloudWatch Logs Insights, AWS X-Ray tracing, API caching & throttling' },
    ],
    milestones: [
      {
        id: 'dva-m1',
        label: 'Build the Serverless API (API Gateway + Lambda + DynamoDB)',
        detail: 'Configure route integration, execution role permissions, and partition keys.',
        actionType: 'lab',
        targetId: 'serverless-api',
      },
      {
        id: 'dva-m2',
        label: 'Solve S3 Static Hosting & CORS Lab',
        detail: 'Handle CloudFront OAC, bucket policies, and browser CORS headers.',
        actionType: 'lab',
        targetId: 's3-static-cors',
      },
      {
        id: 'dva-m3',
        label: 'Pass Compute & Serverless Developer Quiz',
        detail: 'Master Lambda timeouts, SQS decoupling, and connection pool reuse.',
        actionType: 'quiz',
        targetId: 'compute-serverless',
      },
      {
        id: 'dva-m4',
        label: 'Pass Storage & Databases Quiz',
        detail: 'Nail DynamoDB partition/sort keys and S3 Presigned URL patterns.',
        actionType: 'quiz',
        targetId: 'storage-databases',
      },
    ],
  },
  {
    id: 'saa-c03',
    code: 'SAA-C03',
    title: 'AWS Certified Solutions Architect – Associate',
    level: 'Associate',
    recommendedOrder: 3,
    devVerdict: 'Pairs cleanly right after Developer Associate to sharpen system design, VPC networking, Multi-AZ resilience, and cost architecture.',
    examFeeUsd: 150,
    durationMinutes: 130,
    questionCount: 65,
    passingScore: 720,
    prepWeeks: '5–7 weeks',
    overview:
      'The industry benchmark for designing distributed systems on AWS. Emphasizes VPC architecture, load balancing, hybrid connectivity, high availability, and cost-efficient data tiers.',
    keyServices: ['VPC/NAT/IGW', 'ALB/NLB', 'RDS Multi-AZ', 'EFS/FSx', 'CloudFront', 'Route 53', 'EventBridge', 'Organizations'],
    domains: [
      { name: 'Design Secure Architectures', percentage: 30, focus: 'Multi-account AWS Organizations, VPC security, KMS, IAM federation' },
      { name: 'Design Resilient Architectures', percentage: 26, focus: 'Multi-AZ vs Multi-Region, Route 53 failover, SQS/DLQ decoupling' },
      { name: 'Design High-Performing Architectures', percentage: 24, focus: 'ElastiCache, CloudFront caching, EBS/EFS selection, Read Replicas' },
      { name: 'Design Cost-Optimized Architectures', percentage: 20, focus: 'S3 Intelligent-Tiering/Glacier, Spot/Savings Plans, serverless trade-offs' },
    ],
    milestones: [
      {
        id: 'saa-m1',
        label: 'Complete VPC Subnets & Security Group Packet Lab',
        detail: 'Configure Internet Gateway routing and least-privilege SG chaining.',
        actionType: 'lab',
        targetId: 'vpc-networking',
      },
      {
        id: 'saa-m2',
        label: 'Pass VPC Networking & CloudFront Quiz',
        detail: 'Distinguish stateful Security Groups, stateless NACLs, and ALB vs NLB.',
        actionType: 'quiz',
        targetId: 'vpc-networking',
      },
      {
        id: 'saa-m3',
        label: 'Review Multi-AZ vs Read Replicas in Data Quiz',
        detail: 'Ensure 80%+ accuracy on RDS failover, EFS vs EBS, and S3 lifecycle tiers.',
        actionType: 'quiz',
        targetId: 'storage-databases',
      },
    ],
  },
  {
    id: 'dop-c02',
    code: 'DOP-C02',
    title: 'AWS Certified DevOps Engineer – Professional',
    level: 'Professional',
    recommendedOrder: 4,
    devVerdict: 'Senior-level milestone once you have 1–2 years of real production AWS experience with CI/CD, IaC, and observability.',
    examFeeUsd: 300,
    durationMinutes: 180,
    questionCount: 75,
    passingScore: 750,
    prepWeeks: '8–12 weeks',
    overview:
      'Tests deep scenario mastery across automated multi-account governance, CloudFormation StackSets, blue/green & canary pipelines, automated incident remediation, and SLO alerting.',
    keyServices: ['CDK / CloudFormation', 'CodePipeline', 'SSM Automation', 'EventBridge', 'AWS Config', 'Control Tower', 'ECS Blue/Green'],
    domains: [
      { name: 'SDLC Automation', percentage: 22, focus: 'Automated testing gates, artifact management, GitOps & CodePipeline' },
      { name: 'Configuration Management & IaC', percentage: 17, focus: 'CloudFormation drift/StackSets, AWS CDK, Elastic Beanstalk/ECS' },
      { name: 'Resilient Cloud Solutions', percentage: 15, focus: 'Multi-region active-active failover, Route 53 health checks' },
      { name: 'Monitoring & Logging', percentage: 15, focus: 'Centralized log aggregation, CloudWatch alarms, OpenTelemetry/X-Ray' },
      { name: 'Incident & Event Response', percentage: 14, focus: 'EventBridge -> SSM Runbooks auto-remediation' },
      { name: 'Security & Compliance', percentage: 17, focus: 'SCP guardrails, AWS Config conformance packs, Inspector' },
    ],
    milestones: [
      {
        id: 'dop-m1',
        label: 'Earn Developer Associate (DVA-C02) Foundation',
        detail: 'Master core SDKs, serverless deployments, and IAM before attempting Pro.',
        actionType: 'study',
      },
      {
        id: 'dop-m2',
        label: 'Practice Infrastructure as Code with AWS CDK or SAM',
        detail: 'Deploy at least one API + DynamoDB stack using `cdk deploy` or `sam deploy`.',
        actionType: 'study',
      },
      {
        id: 'dop-m3',
        label: 'Master Automated VPC & Security Guardrails',
        detail: 'Complete all 5 CloudBench interactive labs as baseline muscle memory.',
        actionType: 'lab',
        targetId: 'iam-policy',
      },
    ],
  },
];
