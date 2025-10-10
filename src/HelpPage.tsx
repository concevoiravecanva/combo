import React from "react";
import { Title, Button, Text, Alert } from "@canva/app-ui-kit";
import { ArrowLeftIcon } from "@canva/app-ui-kit";
import { FormattedMessage } from 'react-intl';
import { messages } from './i18n/messages';

function ShortcutBox({ keys }: { keys: string[] }) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        gap: 4,
        marginLeft: 8,
        verticalAlign: "middle",
      }}
    >
      {keys.map((variant, i) => {
        const parts = variant.split("+");
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {parts.map((p, j) => (
              <span
                key={j}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2px 5px",
                  // Use Canva tokens for light/dark compatibility
                  background: "var(--ui-kit-color-ui-neutral-strong-bg)",
                  border: "1px solid var(--ui-kit-color-ui-border)",
                  borderRadius: 6,
                  fontFamily: "var(--ui-kit-typography-font-family-monospace)",
                  fontSize: 13,
                  lineHeight: 1.2,
                  color: "var(--ui-kit-color-content-fg)",
                }}
              >
                {p}
              </span>
            ))}
          </span>
        );
      })}
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
          size="xsmall"
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
          padding: "24px 16px 40px 16px", // added bottom padding for breathing room
          background: "var(--ui-kit-color-surface)",
          color: "var(--ui-kit-color-typography-primary)",
          fontFamily: "var(--ui-kit-typography-font-family-body)",
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box"
        }}
      >
        <>
          {/* How the app works — Body/Medium (Bold) */}
          <Text size="medium" variant="bold" style={{ display: 'block', margin: 0 }}>
            <FormattedMessage {...messages.help_how_title} />
          </Text>
          <div role="presentation" style={{ height: 12 }} />

          {/* Intro — Body/Medium */}
          <Text size="medium" style={{ display: 'block', margin: '0 0 12px 0' }}>
            <FormattedMessage {...messages.help_intro_body} />
          </Text>

          {/* How to use — Body/Medium (Bold) with guaranteed top spacing */}
          <div style={{ marginTop: 24 }}>
            <Text size="medium" variant="bold" style={{ display: 'block', margin: 0 }}>
              <FormattedMessage {...messages.help_usage_title} />
            </Text>
            <div role="presentation" style={{ height: 12 }} />
          </div>

          <ul style={{ margin: 0, paddingLeft: 16 }}>
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

          {/* Layers panel — Body/Medium (Bold) with same top spacing */}
          <div style={{ marginTop: 24 }}>
            <Text size="medium" variant="bold" style={{ display: 'block', margin: 0 }}>
              <FormattedMessage {...messages.help_layers_title} />
            </Text>
            <div role="presentation" style={{ height: 12 }} />
          </div>

          <ul style={{ margin: 0, paddingLeft: 16 }}>
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

          {/* Keyboard shortcuts — Body/Medium (Bold) with same top spacing */}
          <div style={{ marginTop: 24 }}>
            <Text size="medium" variant="bold" style={{ display: 'block', margin: 0 }}>
              <FormattedMessage {...messages.help_kbd_title} />
            </Text>
            <div role="presentation" style={{ height: 12 }} />
          </div>

          <ul style={{ margin: "0 0 4px 0", paddingLeft: 16 }}>
            <li style={{ marginBottom: 4 }}>
              <Text>
                <b>Add to design:</b>
                <ShortcutBox keys={["Enter"]} />
              </Text>
            </li>
            <li style={{ marginBottom: 4 }}>
              <Text>
                <b>Delete selection:</b>
                <ShortcutBox keys={["Delete", "Backspace"]} />
              </Text>
            </li>
            <li style={{ marginBottom: 4 }}>
              <Text>
                <b>Add shape:</b>
                <ShortcutBox keys={["1", "2", "3", "4", "5", "6", "7", "8"]} />
              </Text>
            </li>
            <li style={{ marginBottom: 4 }}>
              <Text>
                <b>Scale:</b>
                <ShortcutBox keys={["/", "-"]} />
              </Text>
            </li>
            <li style={{ marginBottom: 4 }}>
              <Text>
                <b>Arrange:</b>
                <ShortcutBox keys={["]", "["]} />
              </Text>
            </li>
            <li style={{ marginBottom: 4 }}>
              <Text>
                <b>Undo:</b>
                <ShortcutBox keys={["Cmd+Z", "Ctrl+Z"]} />
              </Text>
            </li>
          </ul>
        </>
        {/* Spacer between "Undo" and the blue info alert */}
        <div role="presentation" style={{ height: 16 }} />
        <div>
          <Alert tone="info" style={{ margin: 0 }}>
            These keyboard shortcuts only work when the app is active. On the canvas editor, Canva's native keyboard shortcuts apply.
          </Alert>
        </div>
      </div>
    </div>
  );
}