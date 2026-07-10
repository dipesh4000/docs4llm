"use client";

import type { DetectedWorkflow } from "@/lib/ai/workflow-detector";

interface WorkflowDiagramProps {
  workflow: DetectedWorkflow;
  showDetails?: boolean;
}

export function WorkflowDiagram({
  workflow,
  showDetails = true,
}: WorkflowDiagramProps) {
  const stepBoxWidth = 140;
  const stepBoxHeight = 60;
  const verticalSpacing = 100;
  const canvasWidth = 600;
  const canvasHeight = (workflow.steps.length + 1) * verticalSpacing + 100;

  const stepPositions = workflow.steps.map((_, idx) => ({
    x: canvasWidth / 2 - stepBoxWidth / 2,
    y: 50 + idx * verticalSpacing,
  }));

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {workflow.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{workflow.description}</p>
        </div>
        <div className="text-right">
          <p className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {workflow.complexity}
          </p>
          <p className="mt-2 text-sm text-gray-500">{workflow.estimatedTime}</p>
        </div>
      </div>

      <svg
        className="rounded-lg bg-gray-50"
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        width="100%"
      >
        {/* Start node */}
        <circle
          cx={canvasWidth / 2}
          cy={30}
          fill="#10b981"
          r="15"
          stroke="white"
          strokeWidth="2"
        />
        <text
          fill="white"
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
          x={canvasWidth / 2}
          y={35}
        >
          START
        </text>

        {/* Steps and connections */}
        {workflow.steps.map((step, idx) => {
          const pos = stepPositions[idx];
          const nextPos =
            idx < workflow.steps.length - 1
              ? stepPositions[idx + 1]
              : { x: canvasWidth / 2, y: canvasHeight - 50 };

          return (
            <g key={`${step.name}-${String(idx)}`}>
              {/* Arrow from previous */}
              {idx === 0 ? (
                <line
                  markerEnd="url(#arrowhead)"
                  stroke="#d1d5db"
                  strokeWidth="2"
                  x1={canvasWidth / 2}
                  x2={pos.x + stepBoxWidth / 2}
                  y1={45}
                  y2={pos.y}
                />
              ) : (
                <line
                  markerEnd="url(#arrowhead)"
                  stroke="#d1d5db"
                  strokeWidth="2"
                  x1={stepPositions[idx - 1].x + stepBoxWidth / 2}
                  x2={pos.x + stepBoxWidth / 2}
                  y1={stepPositions[idx - 1].y + stepBoxHeight}
                  y2={pos.y}
                />
              )}

              {/* Step box */}
              <rect
                fill="#3b82f6"
                height={stepBoxHeight}
                rx="4"
                stroke="white"
                strokeWidth="2"
                width={stepBoxWidth}
                x={pos.x}
                y={pos.y}
              />
              <text
                fill="white"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                x={pos.x + stepBoxWidth / 2}
                y={pos.y + stepBoxHeight / 2 - 5}
              >
                {step.name}
              </text>
              <text
                fill="rgba(255,255,255,0.8)"
                fontSize="10"
                textAnchor="middle"
                x={pos.x + stepBoxWidth / 2}
                y={pos.y + stepBoxHeight / 2 + 12}
              >
                Step {idx + 1}
              </text>

              {/* Arrow to next or end */}
              {idx === workflow.steps.length - 1 && (
                <line
                  markerEnd="url(#arrowhead)"
                  stroke="#d1d5db"
                  strokeWidth="2"
                  x1={pos.x + stepBoxWidth / 2}
                  x2={nextPos.x}
                  y1={pos.y + stepBoxHeight}
                  y2={nextPos.y}
                />
              )}
            </g>
          );
        })}

        {/* End node */}
        <circle
          cx={canvasWidth / 2}
          cy={canvasHeight - 30}
          fill="#10b981"
          r="15"
          stroke="white"
          strokeWidth="2"
        />
        <text
          fill="white"
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
          x={canvasWidth / 2}
          y={canvasHeight - 25}
        >
          END
        </text>

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerHeight="10"
            markerWidth="10"
            orient="auto"
            refX="9"
            refY="3"
          >
            <polygon fill="#d1d5db" points="0 0, 10 3, 0 6" />
          </marker>
        </defs>
      </svg>

      {/* Step details */}
      {showDetails && (
        <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900">Step Details</h4>
          {workflow.steps.map((step, idx) => (
            <div
              className="rounded-lg bg-gray-50 p-3"
              key={`detail-${step.name}`}
            >
              <p className="font-medium text-gray-900">
                Step {idx + 1}: {step.name}
              </p>
              <p className="mt-1 text-sm text-gray-600">{step.description}</p>
              {step.inputParameters.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="font-medium text-gray-700">Inputs:</p>
                  <p className="text-gray-600">
                    {step.inputParameters.join(", ")}
                  </p>
                </div>
              )}
              {step.outputParameters.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="font-medium text-gray-700">Outputs:</p>
                  <p className="text-gray-600">
                    {step.outputParameters.join(", ")}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Integration points */}
      {workflow.integrationPoints.length > 0 && (
        <div className="rounded-lg bg-yellow-50 p-4">
          <h4 className="font-semibold text-gray-900">Integration Points</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {workflow.integrationPoints.map((point) => (
              <span
                className="inline-block rounded-full bg-yellow-200 px-3 py-1 text-sm text-yellow-900"
                key={point}
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
