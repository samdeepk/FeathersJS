import { feathers } from "@feathersjs/feathers";
import socketio from "@feathersjs/socketio";
import http from "http";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { HookContext } from "@feathersjs/feathers";
import * as dotenv from "dotenv";
dotenv.config();
import configuration from "@feathersjs/configuration";
import {
  koa,
  rest,
  bodyParser,
  errorHandler,
  parseAuthentication,
  cors,
  serveStatic
} from '@feathersjs/koa'




// Todo interface with schema validation
interface Todo {
  id?: number;
  text: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// // Validation function for todo data
function validateTodoData(data: any): { text: string; completed?: boolean } {
  if (!data || typeof data.text !== "string" || data.text.trim().length === 0) {
    throw new Error("Todo text is required and must be a non-empty string");
  }
  if (data.text.length > 500) {
    throw new Error("Todo text must be less than 500 characters");
  }
  return {
    text: data.text.trim(),
    completed: typeof data.completed === "boolean" ? data.completed : false,
  };
}

// // A todos service that allows us to create, read, update, and delete todos
class TodoService {
  todos: Todo[] = [];
  private nextId = 1;

  async find(params?: {
    query?: {
      completed?: boolean;
      $limit?: number;
      $skip?: number;
      $sort?: Record<string, 1 | -1>;
    };
  }) {
    let result = [...this.todos];

    // Filter by completed status if provided
    if (params?.query?.completed !== undefined) {
      result = result.filter(
        (todo) => todo.completed === params.query?.completed,
      );
    }

    // Apply sorting
    if (params?.query?.$sort) {
      const sort = params.query.$sort;
      result.sort((a, b) => {
        for (const key in sort) {
          const order = sort[key];
          if (order === 1 || order === -1) {
            const aVal = a[key as keyof Todo];
            const bVal = b[key as keyof Todo];
            if (aVal !== undefined && bVal !== undefined) {
              if (aVal < bVal) return -order;
              if (aVal > bVal) return order;
            }
          }
        }
        return 0;
      });
    }

    // Apply pagination
    const skip = params?.query?.$skip || 0;
    const limit = params?.query?.$limit;
    if (limit) {
      result = result.slice(skip, skip + limit);
    } else if (skip) {
      result = result.slice(skip);
    }

    return result;
  }

  async get(id: number) {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) {
      throw new Error(`Todo with id ${id} not found`);
    }
    return todo;
  }

  async create(data: { text: string; completed?: boolean }) {
    const validated = validateTodoData(data);
    const now = new Date().toISOString();
    const todo: Todo = {
      id: this.nextId++,
      text: validated.text,
      completed: validated.completed || false,
      createdAt: now,
      updatedAt: now,
    };

    this.todos.push(todo);
    return todo;
  }

  async update(id: number, data: { text: string; completed?: boolean }) {
    const todo = await this.get(id);
    const validated = validateTodoData(data);
    const now = new Date().toISOString();

    const updated: Todo = {
      ...todo,
      text: validated.text,
      completed:
        validated.completed !== undefined
          ? validated.completed
          : todo.completed,
      updatedAt: now,
    };

    const index = this.todos.findIndex((t) => t.id === id);
    this.todos[index] = updated;
    return updated;
  }

  async patch(id: number, data: Partial<{ text: string; completed: boolean }>) {
    const todo = await this.get(id);
    const now = new Date().toISOString();

    // Validate text if provided
    if (data.text !== undefined) {
      if (typeof data.text !== "string" || data.text.trim().length === 0) {
        throw new Error("Todo text must be a non-empty string");
      }
      if (data.text.length > 500) {
        throw new Error("Todo text must be less than 500 characters");
      }
    }

    const updated: Todo = {
      ...todo,
      ...(data.text !== undefined && { text: data.text.trim() }),
      ...(data.completed !== undefined && { completed: data.completed }),
      updatedAt: now,
    };

    const index = this.todos.findIndex((t) => t.id === id);
    this.todos[index] = updated;
    return updated;
  }

  async remove(id: number) {
    const todo = await this.get(id);
    this.todos = this.todos.filter((t) => t.id !== id);
    return todo;
  }
}

// // This tells TypeScript what services we are registering
type ServiceTypes = {
  todos: TodoService;
};

// // Create Feathers app
const app = koa(feathers<ServiceTypes>()).configure(configuration());
app.use(serveStatic('public'))

// // Register the todo service on the Feathers application
app.use("todos", new TodoService(), {
  methods: ["find", "get", "create", "update", "patch", "remove"],
});

// console.log(configuration)
// // Configure socket.io for real-time updates
app.configure(
  socketio({
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  }),
);

// // Create HTTP server
// const server = http.createServer();

// // Setup Feathers app with the server (this enables socket.io)
// app.setup(server);

// // Add static file serving middleware
// server.on("request", (req, res) => {
//   // Let socket.io handle its own routes
//   if (req.url && req.url.startsWith("/socket.io")) {
//     return;
//   }

//   // Handle static files
//   if (req.method === "GET" && req.url) {
//     const publicPath = path.join(__dirname, "public");
//     let filePath = path.join(
//       publicPath,
//       req.url === "/" ? "index.html" : req.url,
//     );

//     // Security: prevent directory traversal
//     if (!filePath.startsWith(publicPath)) {
//       res.writeHead(403);
//       res.end("Forbidden");
//       return;
//     }

//     // Try to serve the file
//     if (existsSync(filePath) && !filePath.endsWith(path.sep)) {
//       try {
//         const content = readFileSync(filePath);
//         const ext = path.extname(filePath).toLowerCase();
//         const contentType =
//           {
//             ".html": "text/html",
//             ".js": "application/javascript",
//             ".css": "text/css",
//             ".json": "application/json",
//             ".png": "image/png",
//             ".jpg": "image/jpeg",
//             ".gif": "image/gif",
//             ".svg": "image/svg+xml",
//             ".ico": "image/x-icon",
//           }[ext] || "application/octet-stream";

//         res.writeHead(200, { "Content-Type": contentType });
//         res.end(content);
//         return;
//       } catch (error) {
//         res.writeHead(500);
//         res.end("Internal Server Error");
//         return;
//       }
//     }
//   }

//   // Serve index.html for all other routes (SPA fallback)
//   if (req.url && !req.url.startsWith("/todos")) {
//     const indexPath = path.join(__dirname, "public", "index.html");
//     if (existsSync(indexPath)) {
//       try {
//         const content = readFileSync(indexPath);
//         res.writeHead(200, { "Content-Type": "text/html" });
//         res.end(content);
//         return;
//       } catch (error) {
//         res.writeHead(500);
//         res.end("Internal Server Error");
//         return;
//       }
//     }
//   }

//   res.writeHead(404);
//   res.end("Not Found");
// });



// // Add validation hooks
// app.service("todos").hooks({
//   before: {
//     create: [
//       async (context: HookContext) => {
//         try {
//           if (context.data) {
//             validateTodoData(context.data);
//           }
//         } catch (error) {
//           throw error;
//         }
//       },
//     ],
//     update: [
//       async (context: HookContext) => {
//         try {
//           if (context.data) {
//             validateTodoData(context.data);
//           }
//         } catch (error) {
//           throw error;
//         }
//       },
//     ],
//     patch: [
//       async (context: HookContext) => {
//         if (context.data && context.data.text !== undefined) {
//           if (
//             typeof context.data.text !== "string" ||
//             context.data.text.trim().length === 0
//           ) {
//             throw new Error("Todo text must be a non-empty string");
//           }
//           if (context.data.text.length > 500) {
//             throw new Error("Todo text must be less than 500 characters");
//           }
//           context.data.text = context.data.text.trim();
//         }
//       },
//     ],
//   },
//   after: {
//     create: [
//       async (context: HookContext) => {
//         console.log("A new todo has been created", context.result);
//       },
//     ],
//     update: [
//       async (context: HookContext) => {
//         console.log("A todo has been updated", context.result);
//       },
//     ],
//     patch: [
//       async (context: HookContext) => {
//         console.log("A todo has been patched", context.result);
//       },
//     ],
//     remove: [
//       async (context: HookContext) => {
//         console.log("A todo has been removed", context.result);
//       },
//     ],
//   },
// });

app
  .listen(3030)
  .then(() => console.log("Feathers server listening on localhost:3030"));
