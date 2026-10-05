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

async function resolveDAG(
  workflowSteps: Step[],
): Promise<{ result: string; id: string }[]> {
  if (workflowSteps.length === 0) {
    return [];
  }

  const canResolveNodes = workflowSteps.filter(
    (node) => !node.dependsOn || node.dependsOn.length === 0,
  );

  if (canResolveNodes.length === 0) {
    throw new Error("DAG contains a cycle or unresolved dependencies");
  }

  const results = await Promise.all(
    canResolveNodes.map((node) => runAgent(node.command)),
  );

  const resolvedIds = new Set(canResolveNodes.map((node) => node.id));

  const remainingSteps = workflowSteps
    .filter((node) => !resolvedIds.has(node.id))
    .map((step) => ({
      ...step,
      dependsOn: step.dependsOn!.filter((id) => !resolvedIds.has(id)),
    }));

  const currentResults = results.map((r, index) => ({
    result: r.result,
    id: canResolveNodes[index]?.id!,
  }));

  const remainingResults = await resolveDAG(remainingSteps);

  return [...currentResults, ...remainingResults];
}

function runAgent(command: string): Promise<{ result: string }> {
  return new Promise((resolve) => {
    console.log(`Agent ran for ${command}`);
    resolve({
      result: `Agent ran for ${command}`,
    });
  });
}

app.post("/run-workflow", async (req, res) => {
  const { success, data, error } = WorkflowSchema.safeParse(req.body);

  if (!success) {
    res.status(422).json({
      message: "Invalid input",
      error: error,
    });
    return;
  }

  await resolveDAG(data.steps);
  return res.status(200).json({
    message: "DAG resolved",
  });
});

app.listen(3000);
