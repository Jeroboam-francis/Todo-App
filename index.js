import { Command } from "commander";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import chalk from "chalk";
import Table from "cli-table3";
import prompts from "prompts";

const program = new Command();
const client = new PrismaClient();

program.name("CLI-Todo");
program.version("0.0.1");
program.description(
  "A simple Commmand line Interface applicattion for managing todos"
);


program
  .command("add-todo")
  .description("Add a new todo")
  .action(async function () {
    try {
      const response = await prompts([
        {
          type: "text",
          name: "title",
          message: "Enter the title of the todo you want to add ",
        },
        {
          type: "text",
          name: "description",
          message: "Enter a description of your todo",
        },
        {
          type: "select",
          name: "status",
          message: "Select the status of the todo you added",
          choices: [
            { title: "todo", value: "todo" },
            { title: "in-progress", value: "in-progress" },
            { title: "done", value: "done" },
          ],
          initial: 0,
        },
      ]);

      await client.todo.create({
        data: {
          id: nanoid(5),
          title: response.title,
          description: response.description,
          status: response.status,
        },
      });

      console.log(chalk.green("Todo has been  successfully created 😊"));
    } catch (e) {
      console.log(chalk.bgRed("Error was encounted while creating your todo:"));
      console.log(chalk.red("Please check your input and try again."));
    }
  });


program
  .command("list-todos")
  .description("List all todos")
  .option("-i, --id <value>", "ID of a specific todo")
  .action(async function (options) {
    const id = options.id;
    try {
      let todos;
      if (id) {
        const todo = await client.todo.findUnique({
          where: { id: id },
        });
        todos = todo ? [todo] : [];
      } else {
        todos = await client.todo.findMany();
      }

      if (todos.length === 0) {
        console.log(chalk.yellow("No todos found."));
      } else {
        const table = new Table({
          head: ["ID", "Title", "Description", "Status"],
          colWidths: [10, 20, 40, 15],
        });
        todos.forEach((todo) => {
          let statusColor;
          switch (todo.status) {
            case "done":
              statusColor = chalk.green(todo.status);
              break;
            case "in-progress":
              statusColor = chalk.blue(todo.status);
              break;
            default:
              statusColor = chalk.yellow(todo.status);
          }
          table.push([todo.id, todo.title, todo.description, statusColor]);
        });
        console.log(table.toString());
      }
    } catch (e) {
      console.log(chalk.bgRed("Error was encountered while fetching todos:"));
      console.log(chalk.red("Please check your input and try again."));
    }
  });


program
  .command("update-todo")
  .description("Update a todo")
  .requiredOption("-i, --id <value>", "ID of the todo")
  .action(async function (options) {
    const id = options.id;
    try {
      const existingTodo = await client.todo.findUnique({
        where: { id: id },
      });

      if (!existingTodo) {
        console.log(chalk.yellow(`Todo with ID ${id} not found.`));
        return;
      }

      const response = await prompts([
        {
          type: "text",
          name: "title",
          message: "Enter the new title",
          initial: existingTodo.title,
        },
        {
          type: "text",
          name: "description",
          message: "Enter the new description",
          initial: existingTodo.description,
        },
        {
          type: "select",
          name: "status",
          message: "Select the new status",
          choices: [
            { title: "todo", value: "todo" },
            { title: "in-progress", value: "in-progress" },
            { title: "done", value: "done" },
          ],
          initial:
            existingTodo.status === "todo"
              ? 0
              : existingTodo.status === "in-progress"
                ? 1
                : 2,
        },
      ]);

      await client.todo.update({
        where: { id: id },
        data: {
          title: response.title,
          description: response.description,
          status: response.status,
        },
      });

      console.log(chalk.green("Todo updated saw successfully updated 👍👍"));
    } catch (e) {
      console.log(chalk.bgRed("Error updating todo:"));
      console.log(chalk.red("Please check your input and try again."));
    }
  });


program
  .command("delete-todo")
  .description("Delete a specific todo")
  .requiredOption("-i, --id <value>", "ID of the todo")
  .action(async function (options) {
    const id = options.id;
    try {
      const todo = await client.todo.findUnique({
        where: { id: id },
      });

      if (!todo) {
        console.log(chalk.yellow(`Todo with ID ${id} not found.`));
        return;
      }

      const confirmation = await prompts({
        type: "confirm",
        name: "value",
        message: `Are you sure you want to delete todo "${todo.title}"?`,
        initial: false,
      });

      if (confirmation.value) {
        await client.todo.delete({
          where: { id: id },
        });
        console.log(chalk.green("Todo deleted successfully!"));
      } else {
        console.log(chalk.yellow("Delete operation cancelled."));
      }
    } catch (e) {
      console.log(chalk.bgRed("Error deleting todo:"));
      console.log(chalk.red("Please check your input and try again."));
    }
  });


program
  .command("delete-all-todos")
  .description("Delete all todos")
  .action(async function () {
    try {
      const confirmation = await prompts({
        type: "confirm",
        name: "value",
        message:
          "Are you sure you want to delete ALL todos? This cannot be undone.",
        initial: false,
      });

      if (confirmation.value) {
        await client.todo.deleteMany({});
        console.log(chalk.green("All todos deleted successfully!"));
      } else {
        console.log(chalk.yellow("Delete operation cancelled."));
      }
    } catch (e) {
      console.log(chalk.bgRed("Error deleting todos:"));
      console.log(chalk.red("Please check your input and try again."));
    }
  });


program
  .command("help")
  .description("Show help information")
  .action(function () {
    console.log(chalk.blue("Available commands:"));
    console.log(chalk.green("add-todo") + "          - Add a new todo");
    console.log(
      chalk.green("list-todos") + "        - List all todos or a specific todo"
    );
    console.log(chalk.green("update-todo") + "       - Update a todo");
    console.log(chalk.green("delete-todo") + "       - Delete a specific todo");
    console.log(chalk.green("delete-all-todos") + "  - Delete all todos");
  });

program.parse();
