import React from "react";
import { Title, Button, Text, Alert } from "@canva/app-ui-kit";
import { ArrowLeftIcon } from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from 'react-intl';
import { messages } from './i18n/messages';
import '@canva/app-ui-kit/styles.css';

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
  const intl = useIntl();
  
  // Helper to render FormattedMessage with <b> support
  const renderBoldText = (message: any) => (
    <FormattedMessage {...message} values={{ b: (chunks: any) => <b>{chunks}</b> }} />
  );
  
  return (
    <div
      style={{
        background: "var(--ui-kit-color-elevation-surface-floating-bg)",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
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
          background: "var(--ui-kit-color-elevation-surface-floating-bg)",
          padding: "10px 16px 8px 12px",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box"
        }}
      >
        <Button
          ariaLabel={intl.formatMessage(messages.back_button)}
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
          {intl.formatMessage(messages.help_title)}
        </Title>
      </div>
      {/* Main content */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
          padding: "24px 16px 40px 16px",
          background: "var(--ui-kit-color-elevation-surface-floating-bg)",
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
                {renderBoldText(messages.help_add_shapes)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_select_shapes)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_combine_shapes)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_edit_layers)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_bezier_handles)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_undo)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_clear)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_add_to_design)}
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
                {renderBoldText(messages.help_swatch)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_arrange)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_rotate)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_scale)}
              </Text>
            </li>
            <li>
              <Text>
                {renderBoldText(messages.help_delete)}
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
                {renderBoldText(messages.help_kbd_add_to_design)}
                <ShortcutBox keys={["Enter"]} />
              </Text>
            </li>
            <li style={{ marginBottom: 4 }}>
              <Text>
                {renderBoldText(messages.help_kbd_delete_selection)}
                <ShortcutBox keys={["Delete", "Backspace"]} />
              </Text>
            </li>
            <li style={{ marginBottom: 4 }}>
              <Text>
                {renderBoldText(messages.help_kbd_add_shape)}
                <ShortcutBox keys={["1", "2", "3", "4", "5", "6", "7", "8"]} />
              </Text>
            </li>
            <li style={{ marginBottom: 4 }}>
              <Text>
                {renderBoldText(messages.help_kbd_scale)}
                <ShortcutBox keys={["/", "-"]} />
              </Text>
            </li>
            <li style={{ marginBottom: 4 }}>
              <Text>
                {renderBoldText(messages.help_kbd_arrange)}
                <ShortcutBox keys={["]", "["]} />
              </Text>
            </li>
            <li style={{ marginBottom: 4 }}>
              <Text>
                {renderBoldText(messages.help_kbd_undo)}
                <ShortcutBox keys={["Cmd+Z", "Ctrl+Z"]} />
              </Text>
            </li>
          </ul>
        </>
        {/* Spacer between "Undo" and the blue info alert */}
        <div role="presentation" style={{ height: 16 }} />
        <div>
          <Alert tone="info" style={{ margin: 0 }}>
            <FormattedMessage {...messages.help_kbd_info} />
          </Alert>
        </div>
      </div>
    </div>
  );
}