import { FlashcardItem, ServiceCheatSheetItem, StudyModule } from '../types/aws';

export const STUDY_MODULES: StudyModule[] = [
  {
    id: 'mod-foundations',
    number: '01',
    title: 'Cloud Foundations, Global Infrastructure & Billing',
    category: 'Foundations',
    readTime: '8 min read',
    summary:
      'Understand how AWS organizes Regions, Availability Zones, and Edge Locations, how the Shared Responsibility Model splits work between AWS and your team, and how to avoid surprise bills in your personal sandbox.',
    keyTakeaways: [
      'A Region contains 3+ physically isolated Availability Zones (AZs) linked by sub-2ms fiber.',
      'IAM, Route 53, and CloudFront are Global; EC2, RDS, Lambda, and S3 buckets are Regional.',
      'Always set an AWS Budgets zero-spend or $10 alert before creating NAT Gateways or RDS instances.',
    ],
    sections: [
      {
        heading: 'Regions, Availability Zones & Edge Locations',
        summary:
          'When you deploy code to AWS, you always pick a Region (such as us-east-1 in Virginia or eu-west-1 in Ireland). Inside that Region sit multiple independent Availability Zones.',
        bullets: [
          'Region: A geographic cluster of isolated data centers. Pick the Region closest to your users or dictated by data residency laws (e.g. GDPR in eu-central-1).',
          'Availability Zone (AZ): One or more discrete data centers with redundant power and cooling inside a Region. Deploying across 2+ AZs protects against data center outages.',
          'Edge Locations (400+ POPs): Smaller caching endpoints used by CloudFront and Route 53 DNS to serve static assets close to end users.',
        ],
        comparisonTable: {
          headers: ['Scope', 'Example AWS Services', 'What It Means for Your Code'],
          rows: [
            {
              dimension: 'Global',
              values: ['IAM, Route 53, CloudFront, AWS Organizations', 'No region flag needed; IAM roles work across your whole account.'],
            },
            {
              dimension: 'Regional',
              values: ['S3 Buckets, DynamoDB, Lambda, API Gateway, VPC', 'SDK clients must specify the exact region (e.g., region: "us-east-1").'],
            },
            {
              dimension: 'AZ-Scoped',
              values: ['EC2 Instances, EBS Volumes, VPC Subnets, RDS Primary', 'An EBS volume in us-east-1a cannot attach to an EC2 in us-east-1b directly.'],
            },
          ],
        },
      },
      {
        heading: 'The Shared Responsibility Model for Developers',
        summary:
          'AWS secures the cloud infrastructure ("Security OF the Cloud"), while you secure what you put inside it ("Security IN the Cloud"). The exact dividing line shifts depending on how managed the service is.',
        bullets: [
          'EC2 (IaaS): AWS manages physical servers and the Nitro hypervisor; you patch Linux, configure Security Groups, and secure your Node/Python runtime.',
          'RDS / ECS Fargate (Managed): AWS patches the underlying OS and database engine; you still manage DB users, TLS, VPC access, and IAM permissions.',
          'Lambda / S3 / DynamoDB (Serverless): AWS patches OS, runtime containers, and scaling; you own IAM policies, bucket permissions, input validation, and application dependencies.',
        ],
      },
      {
        heading: 'Avoiding Surprise Sandbox Bills',
        summary:
          'AWS Free Tier covers many beginner experiments, but several production-grade resources charge hourly even with zero traffic.',
        bullets: [
          'NAT Gateways cost ~$32/month per AZ even at 0 GB transferred—skip them in hobby VPCs unless private subnets genuinely need outbound internet.',
          'Unattached Elastic IPs and forgotten RDS instances bill hourly while idle.',
          'Configure AWS Budgets with an email alert at $5 actual and $10 forecasted spend on day one.',
        ],
        codeSnippet: {
          title: 'Create a $10 Monthly Budget Alert via AWS CLI',
          code: `aws budgets create-budget \\
  --account-id 123456789012 \\
  --budget '{
    "BudgetName": "DevSandboxCap",
    "BudgetLimit": { "Amount": "10", "Unit": "USD" },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'`,
        },
      },
    ],
    examTraps: [
      'Amazon S3 bucket names are globally unique across all AWS accounts, yet every S3 bucket lives inside a specific Region you choose at creation.',
      'Edge Locations are NOT full Regions—you cannot launch EC2 instances or RDS databases inside an Edge Location.',
    ],
    quickCheck: {
      question:
        'Which of the following AWS resources requires you to match the exact Availability Zone when attaching it to an EC2 instance?',
      options: [
        'An Amazon S3 bucket',
        'An Amazon EBS volume',
        'An IAM Role',
        'A DynamoDB table',
      ],
      correctIndex: 1,
      explanation:
        'EBS volumes are AZ-scoped block storage drives—they must live in the exact same Availability Zone as the EC2 instance they attach to.',
    },
    relatedLabId: 'compute-sizing',
    relatedQuizId: 'clf-mock',
  },
  {
    id: 'mod-iam',
    number: '02',
    title: 'IAM, Temporary Credentials & Application Security',
    category: 'Security',
    readTime: '10 min read',
    summary:
      'Replace static API keys with IAM Roles, read AWS IAM JSON policies fluently, and store runtime application secrets safely using Secrets Manager and KMS.',
    keyTakeaways: [
      'Never commit AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY to Git or bake them into Docker images.',
      'IAM Roles issue short-lived temporary credentials via AWS STS (Security Token Service).',
      'Policy evaluation order: Default Deny -> Explicit Allow -> Explicit Deny (Explicit Deny always wins).',
    ],
    sections: [
      {
        heading: 'IAM Principals: Users vs. Groups vs. Roles',
        summary:
          'Newcomers often create an IAM User and paste access keys into `.env` on servers. In AWS, IAM Users are for humans (and should use IAM Identity Center / SSO instead where possible); workloads always assume IAM Roles.',
        bullets: [
          'IAM User: Long-term identity with a password or static access keys. Never use for EC2, ECS, or Lambda apps.',
          'IAM Group: A collection of IAM Users sharing permissions (e.g., BackendEngineers). Groups cannot be nested and cannot hold IAM Roles.',
          'IAM Role: An identity without permanent passwords or keys. Trusted services (Lambda, EC2, GitHub Actions OIDC) call sts:AssumeRole to obtain auto-rotating credentials.',
        ],
      },
      {
        heading: 'Anatomy of an IAM Policy & ARN',
        summary:
          'Every AWS permission is a JSON document containing one or more Statements. Each statement specifies Effect, Action, Resource, and optional Condition.',
        bullets: [
          'Effect: "Allow" or "Deny". By default, every API call starts implicitly Denied.',
          'Action: Service prefix + API operation (e.g. s3:GetObject, dynamodb:PutItem).',
          'Resource: Amazon Resource Name (ARN) formatted as arn:aws:service:region:account-id:resource.',
          'Bucket vs Object ARN trap: s3:ListBucket acts on arn:aws:s3:::my-bucket, whereas s3:GetObject acts on arn:aws:s3:::my-bucket/*.',
        ],
        codeSnippet: {
          title: 'SDK v3 Automatically Uses Role Credentials (No Keys in Code)',
          code: `import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Automatically reads AWS_SESSION_TOKEN from Lambda or EC2 IMDSv2
const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });

export async function readInvoice(key: string) {
  return s3.send(new GetObjectCommand({
    Bucket: "dev-app-invoices",
    Key: key,
  }));
}`,
        },
      },
      {
        heading: 'Secrets Manager vs. SSM Parameter Store vs. KMS',
        summary:
          'Where should you store database passwords, Stripe API keys, and JWT signing secrets?',
        comparisonTable: {
          headers: ['Service', 'Best Used For', 'Rotation & Cost'],
          rows: [
            {
              dimension: 'SSM Parameter Store',
              values: ['Feature flags, URLs, non-rotating encrypted config strings', 'Standard tier is free (up to 10,000 params); integrates with KMS.'],
            },
            {
              dimension: 'AWS Secrets Manager',
              values: ['RDS/Aurora DB credentials and rotating third-party secrets', '$0.40/secret/month; native automatic 30-day RDS password rotation.'],
            },
            {
              dimension: 'AWS KMS',
              values: ['Managing encryption keys (envelope encryption for S3/EBS/RDS)', '$1/month per Customer Managed Key + API request fees.'],
            },
          ],
        },
        bullets: [
          'Use KMS envelope encryption for large files: KMS generates a fast data key, your app/S3 encrypts the file with the data key, and KMS protects the data key.',
        ],
      },
    ],
    examTraps: [
      'An Explicit Deny in ANY attached policy (identity policy, permission boundary, or Organizations SCP) overrides every Explicit Allow.',
      'Even if you attach AdministratorAccess to an IAM User, an Organizations Service Control Policy (SCP) at the account level can still block actions.',
    ],
    quickCheck: {
      question:
        'A GitHub Actions CI/CD workflow needs to deploy your Lambda function to AWS. What is the cleanest, secret-free authentication method?',
      options: [
        'Store an IAM User access key pair in GitHub Secrets forever',
        'Configure GitHub OIDC federation to assume an IAM Role via STS temporary tokens',
        'Use the AWS Root Account email and password in a deploy script',
        'Disable IAM checks inside the deployment region',
      ],
      correctIndex: 1,
      explanation:
        'OpenID Connect (OIDC) federation lets GitHub Actions exchange a short-lived signed JWT for temporary STS role credentials without storing long-lived AWS keys.',
    },
    relatedLabId: 'iam-policy',
    relatedQuizId: 'iam-security',
  },
  {
    id: 'mod-compute',
    number: '03',
    title: 'Compute: EC2, Lambda Execution Model & Containers',
    category: 'Compute',
    readTime: '9 min read',
    summary:
      'Learn how AWS prices virtual machines, how Lambda containers initialize and reuse state across warm calls, and when Docker on ECS Fargate beats serverless functions.',
    keyTakeaways: [
      'Lambda execution environments preserve global/module-scope variables (like DB clients) across warm invocations.',
      'Increasing Lambda Memory also scales vCPU and network bandwidth proportionally.',
      'Lambda caps execution at 15 minutes and synchronous payloads at 6 MB; longer jobs belong on ECS Fargate or AWS Batch.',
    ],
    sections: [
      {
        heading: 'AWS Lambda Internals for Software Engineers',
        summary:
          'When a request triggers a Lambda function, AWS creates a microVM (Firecracker) if none is warm, runs module-level code (Cold Start), and then invokes your exported handler.',
        bullets: [
          'Cold Start (INIT phase): Downloads bundle, boots Node/Python runtime, runs top-level imports & client setup. Typically 100–600ms.',
          'Warm Invocation: Reuses the frozen microVM and existing TCP connections. Your handler runs in single-digit milliseconds.',
          'Memory = CPU: Setting memory from 128 MB to 1,769 MB gives 1 full vCPU, often reducing total runtime enough that 512 MB costs less than 128 MB.',
          'Hard Limits: 15-minute max timeout, 6 MB synchronous request/response body, up to 10 GB ephemeral /tmp disk.',
        ],
        codeSnippet: {
          title: 'Module-Scope Client Reuse Pattern in Lambda',
          code: `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

// Runs ONCE during Cold Start (INIT) and persists across warm calls
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: { pathParameters?: { id?: string } }) => {
  const orderId = event.pathParameters?.id;
  const result = await client.send(new GetCommand({ TableName: "Orders", Key: { orderId } }));
  return { statusCode: 200, body: JSON.stringify(result.Item ?? null) };
};`,
        },
      },
      {
        heading: 'EC2, ECS Fargate, and App Runner Compared',
        summary:
          'Not every backend fits inside a 15-minute stateless function. Containers and virtual machines fill the gaps.',
        comparisonTable: {
          headers: ['Service', 'Best Workload Fit', 'Operational Overhead'],
          rows: [
            {
              dimension: 'AWS Lambda',
              values: ['Webhooks, REST CRUD, S3 event triggers, spiky APIs', 'Zero server management; pay per request & ms.'],
            },
            {
              dimension: 'AWS App Runner',
              values: ['Standard HTTP web apps from a Git repo or Dockerfile', 'Fully managed load balancing & TLS; minimal knobs.'],
            },
            {
              dimension: 'Amazon ECS + Fargate',
              values: ['Microservices, WebSockets, long-running workers', 'Run Docker containers serverless-style without EC2 patching.'],
            },
            {
              dimension: 'Amazon EC2',
              values: ['Custom kernels, GPUs, steady 24/7 high-CPU workloads', 'Full OS control; use Auto Scaling Groups + Launch Templates.'],
            },
          ],
        },
        bullets: [
          'EC2 Instance Naming: e.g. t4g.small -> "t" (burstable family), "4" (generation), "g" (ARM Graviton CPU, ~20% better price/performance), "small" (size).',
          'EC2 Purchasing Options: On-Demand (flexible), Savings Plans / Reserved (up to 72% off for 1–3 yr commitment), Spot (up to 90% off for interruptible batch jobs).',
        ],
      },
    ],
    examTraps: [
      'Lambda Provisioned Concurrency keeps environments pre-warmed to eliminate cold starts, whereas Reserved Concurrency caps max parallel executions (and guarantees capacity).',
      'EC2 Spot Instances give a 2-minute interruption warning before AWS reclaims capacity—never run single-node stateful databases on Spot.',
    ],
    quickCheck: {
      question:
        'How can you speed up an AWS Lambda function that is CPU-bound during JSON parsing or image compression without rewriting code?',
      options: [
        'Increase the Lambda timeout from 10 seconds to 15 minutes',
        'Increase the Lambda memory allocation (which scales vCPU proportionally)',
        'Move the DynamoDB client inside the handler function',
        'Switch from API Gateway to S3 Static Hosting',
      ],
      correctIndex: 1,
      explanation:
        'In AWS Lambda, CPU power scales linearly with configured Memory size. Bumping memory from 128 MB to 1024 MB grants 8x the CPU share.',
    },
    relatedLabId: 'serverless-api',
    relatedQuizId: 'compute-serverless',
  },
  {
    id: 'mod-storage-db',
    number: '04',
    title: 'Storage & Databases: S3, EBS, EFS, RDS & DynamoDB',
    category: 'Data & Storage',
    readTime: '11 min read',
    summary:
      'Pick the right persistence layer for every data shape—object blobs, shared POSIX files, relational ACID tables, or high-scale NoSQL key-value lookups.',
    keyTakeaways: [
      'S3 provides 99.999999999% (11 nines) durability and supports direct browser uploads via Presigned URLs.',
      'RDS Multi-AZ = High Availability (synchronous standby); RDS Read Replicas = Read Scaling (asynchronous).',
      'DynamoDB requires designing Partition Key + Sort Key around your access patterns to avoid expensive table Scans.',
    ],
    sections: [
      {
        heading: 'Object vs. Block vs. File Storage',
        summary:
          'Software developers often confuse S3, EBS, and EFS because all three "store files", yet they operate at completely different abstraction layers.',
        comparisonTable: {
          headers: ['Service', 'Storage Type', 'Primary Developer Use Case'],
          rows: [
            {
              dimension: 'Amazon S3',
              values: ['Object Storage (HTTP API)', 'User uploads, static SPAs, backups, logs. Max single object: 5 TB.'],
            },
            {
              dimension: 'Amazon EBS',
              values: ['Block Storage (Virtual SSD)', 'Root OS drive and database disk attached to a single EC2 instance in one AZ.'],
            },
            {
              dimension: 'Amazon EFS',
              values: ['Managed NFS File System', 'Shared POSIX directory mounted simultaneously by many EC2/ECS containers across AZs.'],
            },
          ],
        },
        bullets: [
          'S3 Storage Classes: Standard (frequent access), Intelligent-Tiering (auto-moves unknown patterns), Standard-IA (infrequent, 30-day min), Glacier Instant/Flexible/Deep Archive (compliance archives at ~$0.00099/GB/mo).',
          'Direct Uploads: Never stream 500 MB uploads through API Gateway (10 MB limit) or Lambda (6 MB limit)—issue a short-lived S3 Presigned PUT URL instead.',
        ],
        codeSnippet: {
          title: 'Generate a 5-Minute S3 Presigned Upload URL',
          code: `import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "us-east-1" });

export async function createUploadUrl(userId: string, filename: string) {
  const command = new PutObjectCommand({
    Bucket: "user-media-uploads",
    Key: \`uploads/\${userId}/\${filename}\`,
    ContentType: "image/png",
  });
  return getSignedUrl(s3, command, { expiresIn: 300 });
}`,
        },
      },
      {
        heading: 'Relational (RDS / Aurora) vs. NoSQL (DynamoDB)',
        summary:
          'Use RDS PostgreSQL/MySQL when you need complex JOINs, foreign keys, and ORMs like Prisma/Drizzle. Use DynamoDB when you need predictable single-digit millisecond latency at massive concurrency—especially with AWS Lambda.',
        bullets: [
          'RDS Multi-AZ: Maintains a synchronous standby in another AZ with automatic DNS failover (~60s). You cannot send read queries to the Multi-AZ standby.',
          'RDS Read Replicas: Up to 15 asynchronous replicas (can be cross-Region) to offload read-heavy analytics or dashboard queries.',
          'RDS Proxy: Pools database connections so bursts of AWS Lambda invocations do not exhaust Postgres max_connections.',
          'DynamoDB Keys: Partition Key (PK) hashes data across storage partitions; optional Sort Key (SK) sorts items within that PK for range queries (begins_with, between). Always prefer Query over Scan.',
        ],
      },
    ],
    examTraps: [
      'A Multi-AZ RDS standby does NOT serve read traffic—only Read Replicas offload reads.',
      'S3 Versioning cannot be "turned off" once enabled; it can only be suspended, and old object versions continue billing until removed by a Lifecycle Expiration rule.',
    ],
    quickCheck: {
      question:
        'Your frontend React app lets users upload 200 MB MP4 videos. Your backend runs on API Gateway + AWS Lambda. How should uploads be implemented?',
      options: [
        'POST the 200 MB binary file directly through API Gateway to Lambda',
        'Have Lambda return an S3 Presigned PUT URL and upload directly from the browser to S3',
        'Base64-encode the video inside a DynamoDB item',
        'Mount an EFS volume inside the user browser',
      ],
      correctIndex: 1,
      explanation:
        'API Gateway caps payloads at 10 MB and DynamoDB caps items at 400 KB. Presigned URLs let the browser upload directly to S3 securely.',
    },
    relatedLabId: 's3-static-cors',
    relatedQuizId: 'storage-databases',
  },
  {
    id: 'mod-networking',
    number: '05',
    title: 'VPC Networking, Subnets, Firewalls & CloudFront',
    category: 'Networking',
    readTime: '10 min read',
    summary:
      'Demystify CIDR blocks, Public vs. Private subnets, Security Groups vs. Network ACLs, Load Balancers, and CloudFront Origin Access Control.',
    keyTakeaways: [
      'A subnet is "Public" solely because its Route Table sends 0.0.0.0/0 to an Internet Gateway (IGW).',
      'Security Groups are stateful (return traffic auto-allowed) and allow-only; NACLs are stateless and support explicit Deny.',
      'Reference one Security Group ID inside another (sg-web -> sg-rds:5432) instead of hardcoding private IPs.',
    ],
    sections: [
      {
        heading: 'VPCs, CIDR Blocks & Subnets',
        summary:
          'An Amazon VPC is your isolated virtual network inside an AWS Region. You pick a private IPv4 CIDR block—most commonly 10.0.0.0/16 (65,536 addresses)—and slice it into subnets.',
        bullets: [
          '/16 CIDR = 65,536 IPs; /24 CIDR = 256 IPs (AWS reserves 5 IPs per subnet, leaving 251 usable).',
          'Public Subnet: Route table has 0.0.0.0/0 -> Internet Gateway (igw-xxx). Hosts Load Balancers and NAT Gateways.',
          'Private Subnet: No route to IGW. Hosts EC2 app servers, ECS tasks, and RDS databases. Outbound internet (for npm/apt or Stripe API) routes through a NAT Gateway in a public subnet.',
        ],
      },
      {
        heading: 'Security Groups vs. Network ACLs (NACLs)',
        summary:
          'AWS provides two firewall layers inside a VPC. Nearly all day-to-day application work happens in Security Groups.',
        comparisonTable: {
          headers: ['Property', 'Security Group (SG)', 'Network ACL (NACL)'],
          rows: [
            {
              dimension: 'Attached To',
              values: ['Individual ENI (EC2, RDS, ALB, Lambda)', 'Entire VPC Subnet (all resources inside)'],
            },
            {
              dimension: 'Statefulness',
              values: ['Stateful (return traffic automatically allowed)', 'Stateless (must allow inbound AND outbound ephemeral ports 1024-65535)'],
            },
            {
              dimension: 'Rule Types',
              values: ['Allow rules only (implicit deny at end)', 'Both Allow and Deny rules evaluated in numeric order'],
            },
          ],
        },
        bullets: [
          'Security Group Chaining: Allow TCP 5432 on sg-rds from Source = sg-web so autoscaled app nodes connect seamlessly without opening Postgres to the subnet or internet.',
        ],
      },
      {
        heading: 'Load Balancing (ALB vs. NLB) & CloudFront',
        summary:
          'Place an Application Load Balancer (Layer 7) in front of HTTP/HTTPS services for path routing (/api/* vs /*) and free AWS Certificate Manager (ACM) TLS certificates. Use Network Load Balancer (Layer 4) only for raw TCP/UDP or static IP requirements.',
        bullets: [
          'CloudFront + S3 Origin Access Control (OAC): Keep S3 Block Public Access ON while CloudFront signs requests to S3 via SigV4.',
          'Route 53 Alias Records: Unlike standard CNAMEs, Route 53 Alias records work at the zone apex (example.com) and are free for AWS targets like CloudFront or ALB.',
        ],
      },
    ],
    examTraps: [
      'If a subnet cannot reach the internet even with an Internet Gateway attached to the VPC, check BOTH the Subnet Route Table (0.0.0.0/0 -> IGW) AND whether the instance has a Public IPv4 address.',
      'NACLs evaluate rules by lowest rule number first (e.g., Rule #100 runs before Rule #200). Security Groups evaluate ALL rules together.',
    ],
    quickCheck: {
      question:
        'You need to block a single abusive IP address (203.0.113.42) from reaching any instance inside your public subnet. Security Groups only support Allow rules. What should you update?',
      options: [
        'Add an explicit DENY rule in the subnet Network ACL (NACL) at rule #50',
        'Remove the Internet Gateway from the VPC',
        'Change the RDS Multi-AZ setting',
        'Switch the Security Group from stateful to stateless',
      ],
      correctIndex: 0,
      explanation:
        'Security Groups cannot create Deny rules. Network ACLs support explicit Deny rules evaluated in numeric order before Allow rules.',
    },
    relatedLabId: 'vpc-networking',
    relatedQuizId: 'vpc-networking',
  },
  {
    id: 'mod-messaging-iac',
    number: '06',
    title: 'Messaging, Observability & Infrastructure as Code',
    category: 'Architecture & DevOps',
    readTime: '9 min read',
    summary:
      'Decouple microservices with SQS, SNS, and EventBridge; debug production latency using CloudWatch and X-Ray; and ship reproducible cloud environments using AWS CDK and SAM.',
    keyTakeaways: [
      'SQS is a pull-based queue (1 message -> 1 worker); SNS is a push-based pub/sub fan-out (1 event -> N subscribers).',
      'CloudTrail audits AWS API calls ("who deleted the bucket?"); CloudWatch tracks metrics and stdout logs ("error rate spiked").',
      'Define infrastructure in version-controlled code (AWS CDK, SAM, CloudFormation) instead of manual console clicks.',
    ],
    sections: [
      {
        heading: 'SQS vs. SNS vs. EventBridge',
        summary:
          'Synchronous HTTP chains break when one downstream service slows down. Asynchronous messaging keeps APIs responsive under load.',
        comparisonTable: {
          headers: ['Service', 'Pattern', 'Key Developer Mechanics'],
          rows: [
            {
              dimension: 'Amazon SQS',
              values: ['Point-to-Point Queue (Pull)', 'Visibility Timeout hides in-flight messages; Dead-Letter Queue (DLQ) catches poison pills after N retries.'],
            },
            {
              dimension: 'Amazon SNS',
              values: ['Pub/Sub Fan-Out (Push)', 'One OrderPlaced publish fans out simultaneously to SQS fulfillment, SQS analytics, and email alerts.'],
            },
            {
              dimension: 'Amazon EventBridge',
              values: ['Serverless Event Bus', 'Content-based JSON pattern filtering, 100+ AWS service events, SaaS webhooks, and cron schedules.'],
            },
          ],
        },
        bullets: [
          'Standard SQS offers nearly unlimited throughput with at-least-once delivery (write idempotent handlers!); FIFO SQS guarantees strict ordering and exactly-once processing.',
        ],
      },
      {
        heading: 'Observability: CloudWatch, CloudTrail & X-Ray',
        summary:
          'When something fails in production, knowing which tool holds the answer saves hours.',
        bullets: [
          'Amazon CloudWatch: Collects Lambda/ECS console.log streams (Logs), CPU/4xx/5xx time-series (Metrics), and triggers alerts (Alarms).',
          'AWS CloudTrail: Immutable audit log of every IAM/CLI/Console/SDK control-plane API call in your account.',
          'AWS X-Ray: Distributed request tracing across API Gateway -> Lambda -> DynamoDB -> external HTTP calls to pinpoint slow spans.',
        ],
      },
      {
        heading: 'Infrastructure as Code (CloudFormation, SAM & AWS CDK)',
        summary:
          'Clicking through the AWS Console does not scale across staging and production accounts. Infrastructure as Code (IaC) turns cloud resources into pull requests.',
        bullets: [
          'AWS CloudFormation: Declarative YAML/JSON templates managed natively by AWS with drift detection and stack rollbacks.',
          'AWS SAM (Serverless Application Model): Shorthand YAML built on CloudFormation tailored for API Gateway + Lambda + DynamoDB, plus local `sam local invoke`.',
          'AWS CDK (Cloud Development Kit): Write TypeScript classes (e.g., `new s3.Bucket(this, "Assets")`) that synthesize into CloudFormation templates with full type checking.',
        ],
        codeSnippet: {
          title: 'Define an S3 Bucket + Lambda Trigger in AWS CDK (TypeScript)',
          code: `import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";

const uploadsBucket = new s3.Bucket(this, "Uploads", {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
});

const processor = new lambda.NodejsFunction(this, "ImageProcessor", {
  entry: "src/process-image.ts",
});

uploadsBucket.grantRead(processor); // Least-privilege IAM auto-generated!
uploadsBucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(processor)
);`,
        },
      },
    ],
    examTraps: [
      'Standard SQS can occasionally deliver the same message twice or out of order—always make SQS consumers idempotent (e.g. conditional DynamoDB PutItem).',
      'CloudWatch Logs does NOT automatically record who deleted an S3 bucket in IAM—that control-plane audit event lives in AWS CloudTrail.',
    ],
    quickCheck: {
      question:
        'An OrderPlaced event needs to simultaneously trigger an inventory worker queue, an invoice email service, and an analytics pipeline independently. Which pattern is canonical on AWS?',
      options: [
        'Publish the event to an Amazon SNS topic subscribed by separate Amazon SQS queues',
        'Have the browser poll DynamoDB every second',
        'Write the event to an EBS volume shared via SSH',
        'Increase API Gateway timeout to 15 minutes and call all 3 synchronously',
      ],
      correctIndex: 0,
      explanation:
        'The SNS-to-SQS fan-out pattern decouples publishers from multiple independent consumers while giving each consumer its own SQS retry buffer and DLQ.',
    },
    relatedLabId: 'serverless-api',
    relatedQuizId: 'clf-mock',
  },
];

export const FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    category: 'IAM & Security',
    front: 'What is the strict AWS IAM policy evaluation order when multiple policies apply?',
    back: 'Default Deny -> Explicit Allow -> Explicit Deny. Any Explicit Deny anywhere in identity policies, permission boundaries, or SCPs always overrides any Allow.',
  },
  {
    id: 'fc-2',
    category: 'IAM & Security',
    front: 'Why does arn:aws:s3:::my-bucket work for ListBucket but fail for GetObject?',
    back: 'Bucket-level actions target the bucket ARN (arn:aws:s3:::my-bucket), whereas object-level actions (GetObject, PutObject) require the wildcard object suffix (arn:aws:s3:::my-bucket/*).',
    codeHint: '"Resource": ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"]',
  },
  {
    id: 'fc-3',
    category: 'IAM & Security',
    front: 'CloudTrail vs. CloudWatch: Which answers "Who deleted our RDS snapshot yesterday?"',
    back: 'AWS CloudTrail records every control-plane API call (caller identity, timestamp, source IP). CloudWatch tracks performance metrics, alarms, and application logs.',
  },
  {
    id: 'fc-4',
    category: 'IAM & Security',
    front: 'When should a developer pick AWS Secrets Manager over SSM Parameter Store?',
    back: 'Pick Secrets Manager when you need built-in automatic credential rotation (like rotating RDS PostgreSQL passwords every 30 days). SSM Parameter Store Standard tier is free for encrypted config strings.',
  },
  {
    id: 'fc-5',
    category: 'Compute',
    front: 'What are the 3 hard execution limits to remember for AWS Lambda?',
    back: '15-minute maximum execution timeout, 6 MB synchronous request/response payload limit, and up to 10 GB ephemeral /tmp storage (128 MB to 10,240 MB RAM).',
  },
  {
    id: 'fc-6',
    category: 'Compute',
    front: 'Why should AWS SDK clients and DB pools be initialized OUTSIDE the Lambda handler?',
    back: 'Module-level code executes once per Cold Start (INIT phase) and stays cached in memory across warm invocations, avoiding repeated TLS handshakes and connection exhaustion.',
  },
  {
    id: 'fc-7',
    category: 'Compute',
    front: 'Lambda Reserved Concurrency vs. Provisioned Concurrency: What is the difference?',
    back: 'Reserved Concurrency caps maximum parallel executions (and guarantees that pool for the function). Provisioned Concurrency keeps environments pre-initialized in memory to eliminate cold starts.',
  },
  {
    id: 'fc-8',
    category: 'Compute',
    front: 'When should you choose ECS Fargate over AWS Lambda?',
    back: 'When running stateful WebSockets, long-lived background workers exceeding 15 minutes, or existing Dockerized microservices where you do not want to manage EC2 nodes.',
  },
  {
    id: 'fc-9',
    category: 'Storage & DB',
    front: 'RDS Multi-AZ vs. RDS Read Replicas: Which gives High Availability vs. Read Scaling?',
    back: 'Multi-AZ = High Availability (synchronous standby, automatic failover, does NOT serve reads). Read Replicas = Read Scaling (asynchronous replication, serves read-only SQL queries).',
  },
  {
    id: 'fc-10',
    category: 'Storage & DB',
    front: 'How do browsers upload 500 MB files to a private S3 bucket without passing bytes through Lambda?',
    back: 'Your backend generates a short-lived S3 Presigned PUT URL using the AWS SDK and returns it to the browser, which uploads directly to S3 over HTTPS.',
  },
  {
    id: 'fc-11',
    category: 'Storage & DB',
    front: 'Amazon EBS vs. Amazon EFS: Which can be mounted by 20 EC2 instances across multiple AZs at once?',
    back: 'Amazon EFS (Elastic File System) is a multi-AZ shared NFS file system. Standard EBS volumes attach to one EC2 instance in a single Availability Zone.',
  },
  {
    id: 'fc-12',
    category: 'Storage & DB',
    front: 'In DynamoDB, why is Query strongly preferred over Scan?',
    back: 'Query targets a specific Partition Key (and optional Sort Key range) in single-digit ms. Scan reads every item in the entire table, consuming high RCU/cost as data grows.',
  },
  {
    id: 'fc-13',
    category: 'Networking',
    front: 'What specifically makes a VPC Subnet a "Public Subnet"?',
    back: 'Its associated Route Table contains a route sending 0.0.0.0/0 traffic to an Internet Gateway (IGW). Without that route, it is a Private Subnet.',
  },
  {
    id: 'fc-14',
    category: 'Networking',
    front: 'Security Group vs. Network ACL (NACL): Which is stateful and which is stateless?',
    back: 'Security Groups are stateful (allowed inbound automatically permits return outbound) and allow-only. NACLs are stateless (require explicit inbound + outbound ephemeral ports) and support Deny rules.',
  },
  {
    id: 'fc-15',
    category: 'Networking',
    front: 'How does CloudFront read objects from an S3 bucket that has Block Public Access enabled?',
    back: 'Origin Access Control (OAC) signs CloudFront requests with SigV4, paired with an S3 Bucket Policy trusting only that CloudFront distribution ARN.',
  },
  {
    id: 'fc-16',
    category: 'Networking',
    front: 'Application Load Balancer (ALB) vs. Network Load Balancer (NLB): When do you need NLB?',
    back: 'Use ALB (Layer 7) for HTTP/HTTPS host/path routing. Use NLB (Layer 4) for raw TCP/UDP, ultra-low latency, or when clients need static Elastic IP addresses.',
  },
  {
    id: 'fc-17',
    category: 'Messaging & IaC',
    front: 'Amazon SQS Standard vs. SQS FIFO: What trade-off do you make?',
    back: 'Standard SQS offers near-unlimited throughput with at-least-once, best-effort ordering. FIFO SQS guarantees strict First-In-First-Out ordering and exactly-once processing (up to 3,000 msg/s batched).',
  },
  {
    id: 'fc-18',
    category: 'Messaging & IaC',
    front: 'What happens to a failing message in SQS when maxReceiveCount is reached?',
    back: 'SQS moves the unprocessable "poison pill" message to a configured Dead-Letter Queue (DLQ) so engineers can inspect it without blocking healthy queue traffic.',
  },
];

export const SERVICE_CHEAT_SHEET: ServiceCheatSheetItem[] = [
  {
    service: 'AWS IAM',
    category: 'Security',
    devAnalogy: 'RBAC + OAuth Scopes',
    pricingUnit: 'Free',
    keyFact: 'Global service; always prefer IAM Roles + STS over static IAM User keys.',
  },
  {
    service: 'AWS Secrets Manager',
    category: 'Security',
    devAnalogy: 'Encrypted .env with rotation',
    pricingUnit: '$0.40 / secret / mo',
    keyFact: 'Built-in 30-day automatic password rotation for Amazon RDS & Aurora.',
  },
  {
    service: 'AWS Lambda',
    category: 'Compute',
    devAnalogy: 'Stateless Express Handler',
    pricingUnit: 'Requests + GB-seconds',
    keyFact: '15-min max timeout; 1M requests/mo always included in Free Tier.',
  },
  {
    service: 'Amazon ECS (Fargate)',
    category: 'Compute',
    devAnalogy: 'Serverless Docker Compose',
    pricingUnit: 'vCPU-hr + GB-hr',
    keyFact: 'Runs containers without patching EC2 nodes; great for WebSockets & long jobs.',
  },
  {
    service: 'Amazon EC2',
    category: 'Compute',
    devAnalogy: 'Linux VPS / VM',
    pricingUnit: 'Per second (running)',
    keyFact: 'Full OS control; save up to 72% with Savings Plans or 90% with Spot.',
  },
  {
    service: 'Amazon S3',
    category: 'Storage',
    devAnalogy: 'Unlimited Blob Key-Value Store',
    pricingUnit: 'GB-month + Requests + Egress',
    keyFact: '11 nines durability; max single object 5 TB; use Presigned URLs for uploads.',
  },
  {
    service: 'Amazon EFS',
    category: 'Storage',
    devAnalogy: 'Shared Network Drive (NFS)',
    pricingUnit: 'GB-month stored',
    keyFact: 'Auto-scales POSIX storage mounted concurrently across multiple AZs.',
  },
  {
    service: 'Amazon RDS / Aurora',
    category: 'Databases',
    devAnalogy: 'Managed PostgreSQL / MySQL',
    pricingUnit: 'Instance-hr + Storage GB',
    keyFact: 'Multi-AZ for automatic failover; Read Replicas for read scaling.',
  },
  {
    service: 'Amazon DynamoDB',
    category: 'Databases',
    devAnalogy: 'Serverless Key-Value / NoSQL',
    pricingUnit: 'On-Demand RRU/WRU + GB',
    keyFact: 'Stateless HTTPS API (no connection pools); single-digit ms latency at any scale.',
  },
  {
    service: 'Amazon VPC',
    category: 'Networking',
    devAnalogy: 'Private LAN + Firewall',
    pricingUnit: 'Free (NAT GW & Data billed)',
    keyFact: 'Security Groups are stateful; NACLs are stateless; NAT Gateways cost ~$32/mo.',
  },
  {
    service: 'Amazon CloudFront',
    category: 'Networking',
    devAnalogy: 'Global Edge CDN + TLS',
    pricingUnit: 'Data transfer out + Requests',
    keyFact: '400+ edge locations; pairs with S3 via Origin Access Control (OAC).',
  },
  {
    service: 'Amazon SQS / SNS',
    category: 'Messaging',
    devAnalogy: 'BullMQ / Redis Pub-Sub',
    pricingUnit: 'Per million requests',
    keyFact: 'SNS fans out events to multiple SQS queues; use DLQs for failed retries.',
  },
  {
    service: 'AWS CloudTrail',
    category: 'Observability',
    devAnalogy: 'Control-Plane Audit Log',
    pricingUnit: '1st management trail free',
    keyFact: 'Records every AWS API call ("who did what, when, and from which IP").',
  },
  {
    service: 'AWS CDK / SAM',
    category: 'IaC',
    devAnalogy: 'TypeScript Cloud Blueprints',
    pricingUnit: 'Free (bills created resources)',
    keyFact: 'Synthesizes TypeScript or YAML into reproducible CloudFormation stacks.',
  },
];
