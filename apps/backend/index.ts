import express from "express";
import z from "zod";

const app = express();

app.use(express.json());

const WorkflowStep = z.object({
  id: z.string(),
  command: z.string(),
  dependsOn: z.array(z.string()).optional(),
});

const WorkflowSchema = z.object({
  workflowId: z.string(),
  steps: z.array(WorkflowStep),
});

type Workflow = z.infer<typeof WorkflowSchema>;
type Step = z.infer<typeof WorkflowStep>;

function resolveDAG(workflowSteps: Step[]) {
  while (true) {
    let filteredSteps = workflowSteps.filter((step) => !step.dependsOn);
    console.log("NEW: ")
    console.log(filteredSteps)
  }
}

app.post("/run-workflow", (req, res) => {
  const { success, data, error } = WorkflowSchema.safeParse(req.body);

  if (!success) {
    res.status(422).json({
      message: "Invalid input",
      error: error
    });
    return;
  }

  console.log("OLD: ")
  console.log(data.steps)
  resolveDAG(data.steps);
});

app.listen(3000);
