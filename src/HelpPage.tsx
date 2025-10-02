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
        fontFamily: "monospace",
        fontSize: 13,
        color: "#222",
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
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      {/* Header, smaller and neutral */}
      <div
        style={{
          width: "100%",
          background: "var(--ui-kit-color-surface)",
          padding: "10px 0 8px 0",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--ui-kit-color-border)",
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
          style={{ marginLeft: 12, marginRight: 8 }}
        />
        <Title size="small" style={{ color: "var(--ui-kit-color-typography-secondary)", fontWeight: 500 }}>
          Help
        </Title>
      </div>
      {/* Main content, no shadow or special background */}
      <div
        style={{
          maxWidth: 420,
          width: "90vw",
          margin: "24px auto 0 auto",
          padding: 0,
          background: "var(--ui-kit-color-surface)",
          borderRadius: 0,
          color: "var(--ui-kit-color-typography-primary)"
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
          How the app works
        </div>
        <Text size="small" tone="tertiary" style={{ marginBottom: 12 }}>
          Combo lets you create and edit vector shapes, then add them to your Canva design.
        </Text>
        <div style={{ fontWeight: 600, margin: "16px 0 8px" }}>
          How to use
        </div>
        <ul style={{ margin: "0 0 10px 0", paddingLeft: 16 }}>
          <li><b>Add shapes:</b> Select from the shape palette to add new shapes to the canvas.</li>
          <li><b>Select shapes:</b> Click a shape on the canvas or in the layers panel to select it. Hold <b>Shift</b> to select up to two shapes at once.</li>
          <li><b>Combine shapes:</b> Select two shapes and use the Union, Subtract, Intersect, or Exclude buttons to combine them.</li>
          <li><b>Edit layers:</b> In the layers panel, you can change colors, reorder, resize, or delete shapes.</li>
          <li><b>Bezier handles:</b> Drag the handles to adjust paths and curves. Use the eye icon to show or hide them.</li>
          <li><b>Undo:</b> Click the undo button to revert your last change.</li>
          <li><b>Clear:</b> Click the clear button to remove all shapes from the canvas.</li>
          <li><b>Add to design:</b> When you’re happy with your shapes, click this button to add them to your Canva design.</li>
        </ul>
        <div style={{ fontWeight: 600, margin: "16px 0 8px" }}>
          Layers panel
        </div>
        <ul style={{ margin: "0 0 10px 0", paddingLeft: 16 }}>
          <li><b>Swatch:</b> Change the shape’s fill color.</li>
          <li><b>Arrange:</b> Move the shape forward or backward in the layer stack.</li>
          <li><b>Rotate:</b> Turn the shape in 10° steps.</li>
          <li><b>Scale:</b> Make the shape bigger or smaller by 10%.</li>
          <li><b>Delete:</b> Remove the shape from the canvas.</li>
        </ul>
        <div style={{ fontWeight: 600, margin: "16px 0 8px" }}>
          Keyboard shortcuts
        </div>
        <ul style={{ margin: "0 0 8px", paddingLeft: 16 }}>
          <li>
            <b>Add to design:</b>
            <ShortcutBox keys={["Enter"]} />
          </li>
          <li>
            <b>Delete selection:</b>
            <ShortcutBox keys={["Delete", "Backspace"]} />
          </li>
          <li>
            <b>Add shape:</b>
            <ShortcutBox keys={["1", "2", "3", "4", "5", "6", "7", "8"]} />
          </li>
          <li>
            <b>Scale up:</b>
            <ShortcutBox keys={["/"]} />
          </li>
          <li>
            <b>Scale down:</b>
            <ShortcutBox keys={["-"]} />
          </li>
          <li>
            <b>Arrange up:</b>
            <ShortcutBox keys={["]"]} />
          </li>
          <li>
            <b>Arrange down:</b>
            <ShortcutBox keys={["["]} />
          </li>
          <li>
            <b>Undo:</b>
            <ShortcutBox keys={["Cmd", "Ctrl", "Z"]} />
          </li>
          <li>
            <b>Select / multi-select:</b>
            <ShortcutBox keys={["Click", "Shift+Click"]} />
          </li>
        </ul>
        {/* Info alert below all content */}
        <Alert tone="info" style={{ marginTop: 24 }}>
          These keyboard shortcuts only work when the app is active.
        </Alert>
      </div>
    </div>
  );
}