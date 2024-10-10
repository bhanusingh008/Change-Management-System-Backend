import express, { Request, Response } from "express";
import { PrismaClient, Priority, ChangeType, User } from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import authMiddleware from "./middlewares/authMiddlewares";

// Initialize Prisma Client
const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Using morgan for http request logging
app.use(morgan("dev"));

// have cors enabled
app.use(
  cors({
    origin: ["http://localhost:5173"], // Allow these origins
    methods: ["GET", "POST", "PUT"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

interface AddUserRequest {
  email: string;
  password: string;
  role: number;
}

interface UserLoginRequest {
  email: string;
  password: string;
}

// Defining Interface for ChangeTicketRequest
interface ChangeTicketRequest {
  title: string;
  description: string;
  priority: Priority; // Using Enum Priority
  type: ChangeType; // Using Enum for Type
  affectedSystems: string;
  createdById: number; // Id of the user
  creatorRole: number;
}

app.post(
  "/add-user",
  async (req: Request<{}, {}, AddUserRequest>, res: Response) => {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          role: role,
        },
      });
      res.status(201).json({ email: user.email, role: user.role });
    } catch (error) {
      res.status(500).json("Failed to Add User");
    }
  }
);

// User Login
app.post(
  "/login-user",
  async (req: Request<{}, {}, UserLoginRequest>, res: Response) => {
    const { email, password } = req.body;
    try {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // If user is not found
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Compare the password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      // If password is incorrect
      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Generate a JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        "jwt_token",
        {
          expiresIn: "24h", // Token expiration time
        }
      );

      // Send token as response
      res
        .status(200)
        .json({ token: token, user_id: user.id, user_role: user.role });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
);

// endpoint to add a change ticked
app.post(
  "/add-change-ticket",
  authMiddleware,
  async (req: Request<{}, {}, ChangeTicketRequest>, res: Response) => {
    const {
      title,
      description,
      priority,
      type,
      affectedSystems,
      createdById,
      creatorRole,
    } = req.body;

    try {
      const ticket = await prisma.changeTicket.create({
        data: {
          title,
          description,
          priority,
          type,
          affectedSystems,
          createdById: createdById,
          creatorRole: creatorRole,
        },
      });
      res.status(201).json(ticket);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create change ticket" });
    }
  }
);

interface GetMyTicketsReq extends Request {
  user_id?: number;
  user_role?: number;
}

app.get(
  "/get-my-tickets",
  authMiddleware,
  async (req: GetMyTicketsReq, res: Response) => {
    const user_id = req.user_id;

    if (!user_id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const fetch = await prisma.changeTicket.findMany({
        where: { createdById: user_id },
      });

      res.status(200).json(fetch);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to get the user tickets" });
      return;
    }
  }
);

app.get(
  "/get-my-review-tickets",
  authMiddleware,
  async (req: GetMyTicketsReq, res: Response) => {
    const user_role = req?.user_role;
    try {
      const fetch = await prisma.changeTicket.findMany({
        where: { creatorRole: { lt: user_role } },
      });

      res.status(200).json(fetch);
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to get the user tickets" });
      return;
    }
  }
);

app.put('/ticket/approve', authMiddleware ,async (req: GetMyTicketsReq, res: Response) => {
  const { ticketId } = req.body;
  const userId = req?.user_id;

  try {
    const update = await prisma.changeTicket.update({ data: { approvedById: userId, updatedAt: new Date(), status: 'Approved' }, where: { id: ticketId } });
    res.status(201).json("Ticket Approved");
  } catch (err) { 
    res.status(500).json("Ticket Not Approved, Due to some error.")
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
