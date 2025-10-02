import React from "react";
import { Title, Button, Text, Alert } from "@canva/app-ui-kit";
import { ArrowLeftIcon } from "@canva/app-ui-kit";

function ShortcutBox({ keys }: { keys: string[] }) {
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 4,
        background: "#F3F4F6",
        borderRadius: 6,
        padding: "2px 8px",
        fontFamily: "var(--ui-kit-typography-font-family-monospace)",
        fontSize: 13,
        color: "var(--ui-kit-color-typography-primary)",
        marginLeft: 6,
        verticalAlign: "middle"
      }}
    >
      {keys.map((key, i) => (
        <span key={i} style={{ padding: "0 2px" }}>
          {key}
        </span>
      ))}
    </span>
  );
}

export default function HelpPage({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        background: "var(--ui-kit-color-surface)",
        minHeight: "100vh",
        width: "100%",            // ...changed from 100vw...
        maxWidth: "100%",         // ...ensure no overflow...
        fontFamily: "var(--ui-kit-typography-font-family-body)",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden"
      }}
    >
      {/* Header */}
      <div
        style={{
          width: "100%",
          background: "var(--ui-kit-color-surface)",
          padding: "10px 16px 8px 12px",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box"
        }}
      >
        <Button
          ariaLabel="Back"
          icon={ArrowLeftIcon}
          variant="tertiary"
          size="small"
          type="button"
          onClick={onBack}
          style={{ marginRight: 8 }}
        />
        <Title
          size="small"
          style={{
            color: "var(--ui-kit-color-typography-secondary)",
            fontWeight: 500,
            fontFamily: "var(--ui-kit-typography-font-family-heading)"
          }}
        >
          Help
        </Title>
      </div>
      {/* Main content */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
          padding: "24px 16px 0 16px",
          background: "var(--ui-kit-color-surface)",
          color: "var(--ui-kit-color-typography-primary)",
          fontFamily: "var(--ui-kit-typography-font-family-body)",
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box"
          // removed marginRight: 24
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 18,
            marginBottom: 8,
            fontFamily: "var(--ui-kit-typography-font-family-heading)"
          }}
        >
          How the app works
        </div>
        <Text size="small" tone="tertiary" style={{ marginBottom: 12 }}>
          Combo lets you create and edit vector shapes, then add them to your Canva design.
        </Text>
        <div
          style={{
            fontWeight: 600,
            margin: "16px 0 8px",
            fontFamily: "var(--ui-kit-typography-font-family-heading)"
          }}
        >
          How to use
        </div>
        <ul style={{ margin: "0 0 10px 0", paddingLeft: 16 }}>
          <li>
            <Text>
              <b>Add shapes:</b> Select from the shape palette to add new shapes to the canvas.
            </Text>
          </li>
          <li>
            <Text>
              <b>Select shapes:</b> Click a shape on the canvas or in the layers panel to select it. Hold <b>Shift</b> to select up to two shapes at once.
            </Text>
          </li>
          <li>
            <Text>
              <b>Combine shapes:</b> Select two shapes and use the Union, Subtract, Intersect, or Exclude buttons to combine them.
            </Text>
          </li>
          <li>
            <Text>
              <b>Edit layers:</b> In the layers panel, you can change colors, reorder, resize, or delete shapes.
            </Text>
          </li>
          <li>
            <Text>
              <b>Bezier handles:</b> Drag the handles to adjust paths and curves. Use the eye icon to show or hide them.
            </Text>
          </li>
          <li>
            <Text>
              <b>Undo:</b> Click the undo button to revert your last change.
            </Text>
          </li>
          <li>
            <Text>
              <b>Clear:</b> Click the clear button to remove all shapes from the canvas.
            </Text>
          </li>
          <li>
            <Text>
              <b>Add to design:</b> When you’re happy with your shapes, click this button to add them to your Canva design.
            </Text>
          </li>
        </ul>
        <div
          style={{
            fontWeight: 600,
            margin: "16px 0 8px",
            fontFamily: "var(--ui-kit-typography-font-family-heading)"
          }}
        >
          Layers panel
        </div>
        <ul style={{ margin: "0 0 10px 0", paddingLeft: 16 }}>
          <li>
            <Text>
              <b>Swatch:</b> Change the shape’s fill color.
            </Text>
          </li>
          <li>
            <Text>
              <b>Arrange:</b> Move the shape forward or backward in the layer stack.
            </Text>
          </li>
          <li>
            <Text>
              <b>Rotate:</b> Turn the shape in 10° steps.
            </Text>
          </li>
          <li>
            <Text>
              <b>Scale:</b> Make the shape bigger or smaller by 10%.
            </Text>
          </li>
          <li>
            <Text>
              <b>Delete:</b> Remove the shape from the canvas.
            </Text>
          </li>
        </ul>
        <div
          style={{
            fontWeight: 600,
            margin: "16px 0 8px",
            fontFamily: "var(--ui-kit-typography-font-family-heading)"
          }}
        >
          Keyboard shortcuts
        </div>
        <ul style={{ margin: "0 0 8px", paddingLeft: 16 }}>
          <li>
            <Text>
              <b>Add to design:</b>
              <ShortcutBox keys={["Enter"]} />
            </Text>
          </li>
          <li>
            <Text>
              <b>Delete selection:</b>
              <ShortcutBox keys={["Delete", "Backspace"]} />
            </Text>
          </li>
          <li>
            <Text>
              <b>Add shape:</b>
              <ShortcutBox keys={["1", "2", "3", "4", "5", "6", "7", "8"]} />
            </Text>
          </li>
          <li>
            <Text>
              <b>Scale up:</b>
              <ShortcutBox keys={["/"]} />
            </Text>
          </li>
          <li>
            <Text>
              <b>Scale down:</b>
              <ShortcutBox keys={["-"]} />
            </Text>
          </li>
          <li>
            <Text>
              <b>Arrange up:</b>
              <ShortcutBox keys={["]"]} />
            </Text>
          </li>
          <li>
            <Text>
              <b>Arrange down:</b>
              <ShortcutBox keys={["["]} />
            </Text>
          </li>
          <li>
            <Text>
              <b>Undo:</b>
              <ShortcutBox keys={["Cmd", "Ctrl", "Z"]} />
            </Text>
          </li>
          <li>
            <Text>
              <b>Select / multi-select:</b>
              <ShortcutBox keys={["Click", "Shift+Click"]} />
            </Text>
          </li>
        </ul>
        <div>
          <Alert tone="info" style={{ marginTop: 24 }}>
            These keyboard shortcuts only work when the app is active.
          </Alert>
        </div>
      </div>
    </div>
  );
}