import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  palette_add_shape: {
    defaultMessage: 'Add {shape}',
    description: 'Tooltip / aria-label for button that adds a specific shape'
  },
  boolean_union: {
    defaultMessage: 'Union',
    description: 'Boolean operation button label: create union of two shapes'
  },
  boolean_subtract: {
    defaultMessage: 'Subtract',
    description: 'Boolean operation button label: subtract B from A'
  },
  boolean_intersect: {
    defaultMessage: 'Intersect',
    description: 'Boolean operation button label: intersection of two shapes'
  },
  boolean_exclude: {
    defaultMessage: 'Exclude',
    description: 'Boolean operation button label: XOR (exclude overlap) of two shapes'
  },
  toolbar_clear: {
    defaultMessage: 'Clear',
    description: 'Global action button to remove all shapes'
  },
  toolbar_upload: {
    defaultMessage: 'Upload',
    description: 'Button to push current design to Canva'
  },
  toolbar_undo: {
    defaultMessage: 'Undo',
    description: 'Undo last action button'
  },
  toolbar_handles_show: {
    defaultMessage: 'Show handles',
    description: 'Button label when bezier handles are hidden'
  },
  toolbar_handles_hide: {
    defaultMessage: 'Hide handles',
    description: 'Button label when bezier handles are visible'
  },
  layers_heading: {
    defaultMessage: 'Layers',
    description: 'Heading for layers panel'
  },
  help_heading: {
    defaultMessage: 'Help / Shortcuts',
    description: 'Expandable help section heading'
  },
  help_how_title: {
    defaultMessage: 'How the app works',
    description: 'Title inside help panel describing how the app functions'
  },
  help_usage_title: {
    defaultMessage: 'How to use:',
    description: 'Subheading before usage instructions list'
  },
  help_list_add: {
    defaultMessage: 'Add shapes: Use the shape palette to add shapes.',
    description: 'Help list item: how to add shapes'
  },
  help_list_select: {
    defaultMessage: 'Select shapes: Click shapes or use Shift+Click for multi-select.',
    description: 'Help list item: selecting shapes'
  },
  help_list_combine: {
    defaultMessage: 'Combine shapes: Select two shapes then run boolean operations.',
    description: 'Help list item: boolean operations'
  },
  help_list_edit_layers: {
    defaultMessage: 'Edit layers: Change color, order, scale, or delete.',
    description: 'Help list item: layer editing'
  },
  help_list_handles: {
    defaultMessage: 'Bezier handles: Toggle handles to adjust curves.',
    description: 'Help list item: bezier handles'
  },
  help_list_undo: {
    defaultMessage: 'Undo: Revert your last change.',
    description: 'Help list item: undo'
  },
  help_list_clear: {
    defaultMessage: 'Clear: Remove all shapes.',
    description: 'Help list item: clear canvas'
  },
  help_list_upload: {
    defaultMessage: 'Upload: Send your design to Canva.',
    description: 'Help list item: upload'
  },
  help_buttons_title: {
    defaultMessage: 'Button explanations',
    description: 'Subheading for button explanations list'
  },
  help_shortcuts_title: {
    defaultMessage: 'Shortcuts',
    description: 'Subheading for shortcuts list'
  },
  no_shapes: {
    defaultMessage: 'No shapes',
    description: 'Message shown when there are no shapes'
  },
  color_change_announce: {
    defaultMessage: 'Color changed',
    description: 'Live region announcement after changing color'
  },
  rotate_announce: {
    defaultMessage: 'Rotated 10 degrees',
    description: 'Live region announcement after a 10 degree rotation'
  },
  deleted_shape_announce: {
    defaultMessage: 'Shape deleted',
    description: 'Live region announcement after deleting a shape'
  },
  selection_none: {
    defaultMessage: 'No shapes selected',
    description: 'Announcement when selection becomes empty'
  },
  selection_one: {
    defaultMessage: '1 shape selected',
    description: 'Announcement when exactly one shape selected'
  },
  selection_many: {
    defaultMessage: '{count} shapes selected',
    description: 'Announcement when multiple shapes selected (count variable)'
  },

  preview_heading: {
    defaultMessage: 'Preview',
    description: 'Heading above the preview/canvas area'
  },
  shapes_heading: {
    defaultMessage: 'Shapes',
    description: 'Heading above the shape palette'
  },
  palette_aria_label: {
    defaultMessage: 'Shape palette',
    description: 'Aria-label for the group of shape buttons'
  },
  app_main_aria_label: {
    defaultMessage: 'Vector editor',
    description: 'Aria-label for the main application region'
  },
  canvas_aria_label: {
    defaultMessage: 'Vector drawing area',
    description: 'Aria-label for the canvas drawing surface'
  },
  empty_canvas_hint: {
    defaultMessage: 'Click a shape below to add it to canvas',
    description: 'Hint shown when there are no shapes on canvas'
  },
  layers_list_aria: {
    defaultMessage: 'Layer list',
    description: 'Aria-label for the list of layers'
  },

  // Help / Shortcuts labels
  shortcuts_delete_selection: {
    defaultMessage: 'Delete selection:',
    description: 'Label for shortcut that deletes the selected shape(s)'
  },
  shortcuts_undo: {
    defaultMessage: 'Undo:',
    description: 'Label for shortcut that undoes the last action'
  },
  shortcuts_select_multiselect: {
    defaultMessage: 'Select / multi-select:',
    description: 'Label for shortcut explaining selection and multi-selection'
  },
  shortcut_add_to_design: {
    defaultMessage: 'Add to design',
    description: 'Description for Enter key shortcut'
  },
  shortcut_delete: {
    defaultMessage: 'Delete',
    description: 'Description for Delete/Backspace shortcut'
  },
  shortcut_add_shape: {
    defaultMessage: 'Add shape',
    description: 'Description for number keys to add shapes'
  },
  tool_move_up: {
    defaultMessage: 'Move up',
    description: 'Tooltip/aria for layers panel action button to move a layer up'
  },
  tool_move_down: {
    defaultMessage: 'Move down',
    description: 'Tooltip/aria for layers panel action button to move a layer down'
  },
  tool_rotate: {
    defaultMessage: 'Rotate',
    description: 'Tooltip/aria for layers panel action button to rotate the shape'
  },
  tool_scale_up: {
    defaultMessage: 'Scale up',
    description: 'Tooltip/aria for layers panel action button to scale the shape up'
  },
  tool_scale_down: {
    defaultMessage: 'Scale down',
    description: 'Tooltip/aria for layers panel action button to scale the shape down'
  },
  tool_delete: {
    defaultMessage: 'Delete',
    description: 'Tooltip/aria for layers panel action button to delete the shape'
  },
  help_intro_body: {
    defaultMessage: 'Combo lets you create and edit vector shapes, then add them to your Canva design.',
    description: 'Intro sentence explaining what the app does'
  },
  help_layers_title: {
    defaultMessage: 'Layers panel',
    description: 'Section title for Layers panel explanation'
  },
  help_kbd_title: {
    defaultMessage: 'Keyboard shortcuts',
    description: 'Section title for the keyboard shortcuts list'
  }
});