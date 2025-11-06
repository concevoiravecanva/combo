import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  // Shape names
  shape_circle: {
    defaultMessage: 'Circle',
    description: 'Shape name: circle'
  },
  shape_square: {
    defaultMessage: 'Square',
    description: 'Shape name: square'
  },
  shape_triangle: {
    defaultMessage: 'Triangle',
    description: 'Shape name: triangle'
  },
  shape_diamond: {
    defaultMessage: 'Diamond',
    description: 'Shape name: diamond'
  },
  shape_pentagon: {
    defaultMessage: 'Pentagon',
    description: 'Shape name: pentagon'
  },
  shape_hexagon: {
    defaultMessage: 'Hexagon',
    description: 'Shape name: hexagon'
  },
  shape_heart: {
    defaultMessage: 'Heart',
    description: 'Shape name: heart'
  },
  shape_star: {
    defaultMessage: 'Star',
    description: 'Shape name: star'
  },
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
    defaultMessage: 'Help',
    description: 'Expandable help section heading'
  },
  help_how_title: {
    defaultMessage: 'How the app works',
    description: 'Title inside help panel describing how the app functions'
  },
  help_usage_title: {
    defaultMessage: 'How to use',
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
  layer_moved_up_announce: {
    defaultMessage: 'Layer moved up',
    description: 'Live region announcement after moving a layer up'
  },
  layer_moved_down_announce: {
    defaultMessage: 'Layer moved down',
    description: 'Live region announcement after moving a layer down'
  },
  scale_up_announce: {
    defaultMessage: 'Scaled up',
    description: 'Live region announcement after scaling up'
  },
  scale_down_announce: {
    defaultMessage: 'Scaled down',
    description: 'Live region announcement after scaling down'
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
  actions_heading: {
    defaultMessage: 'Actions',
    description: 'Heading above the boolean operations'
  },
  boolean_operations_aria: {
    defaultMessage: 'Boolean operations',
    description: 'Aria-label for the group of boolean operation buttons'
  },
  select_two_shapes: {
    defaultMessage: 'Select two shapes to apply an action',
    description: 'Hint message shown below boolean operations buttons'
  },
  add_to_design_button: {
    defaultMessage: 'Add to design',
    description: 'Label for the main button to add shapes to Canva design'
  },
  help_button: {
    defaultMessage: 'Help',
    description: 'Label for the button to open help panel'
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
  layers_select_shape: {
    defaultMessage: 'Select {shape}',
    description: 'Aria-label for selecting a shape row in the layers list'
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
  },
  back_button: {
    defaultMessage: 'Back',
    description: 'Back button aria-label'
  },
  help_title: {
    defaultMessage: 'Help',
    description: 'Help page title'
  },
  help_add_shapes: {
    defaultMessage: '<b>Add shapes:</b> Select from the shape palette to add new shapes to the canvas.',
    description: 'Help instruction for adding shapes'
  },
  help_select_shapes: {
    defaultMessage: '<b>Select shapes:</b> Click a shape on the canvas or in the layers panel to select it. Hold <b>Shift</b> to select up to two shapes at once.',
    description: 'Help instruction for selecting shapes'
  },
  help_combine_shapes: {
    defaultMessage: '<b>Combine shapes:</b> Select two shapes and use the Union, Subtract, Intersect, or Exclude buttons to combine them.',
    description: 'Help instruction for combining shapes'
  },
  help_edit_layers: {
    defaultMessage: '<b>Edit layers:</b> In the layers panel, you can change colors, reorder, resize, or delete shapes.',
    description: 'Help instruction for editing layers'
  },
  help_bezier_handles: {
    defaultMessage: '<b>Bezier handles:</b> Drag the handles to adjust paths and curves. Use the eye icon to show or hide them.',
    description: 'Help instruction for bezier handles'
  },
  help_undo: {
    defaultMessage: '<b>Undo:</b> Click the undo button to revert your last change.',
    description: 'Help instruction for undo'
  },
  help_clear: {
    defaultMessage: '<b>Clear:</b> Click the clear button to remove all shapes from the canvas.',
    description: 'Help instruction for clear'
  },
  help_add_to_design: {
    defaultMessage: '<b>Add to design:</b> When you\'re happy with your shapes, click this button to add them to your Canva design.',
    description: 'Help instruction for add to design'
  },
  help_swatch: {
    defaultMessage: '<b>Swatch:</b> Change the shape\'s fill color.',
    description: 'Help instruction for swatch'
  },
  help_arrange: {
    defaultMessage: '<b>Arrange:</b> Move the shape forward or backward in the layer stack.',
    description: 'Help instruction for arrange'
  },
  help_rotate: {
    defaultMessage: '<b>Rotate:</b> Turn the shape in 10° steps.',
    description: 'Help instruction for rotate'
  },
  help_scale: {
    defaultMessage: '<b>Scale:</b> Make the shape bigger or smaller by 10%.',
    description: 'Help instruction for scale'
  },
  help_delete: {
    defaultMessage: '<b>Delete:</b> Remove the shape from the canvas.',
    description: 'Help instruction for delete'
  },
  help_kbd_add_to_design: {
    defaultMessage: '<b>Add to design:</b>',
    description: 'Keyboard shortcut label for add to design'
  },
  help_kbd_delete_selection: {
    defaultMessage: '<b>Delete selection:</b>',
    description: 'Keyboard shortcut label for delete selection'
  },
  help_kbd_add_shape: {
    defaultMessage: '<b>Add shape:</b>',
    description: 'Keyboard shortcut label for add shape'
  },
  help_kbd_scale: {
    defaultMessage: '<b>Scale:</b>',
    description: 'Keyboard shortcut label for scale'
  },
  help_kbd_arrange: {
    defaultMessage: '<b>Arrange:</b>',
    description: 'Keyboard shortcut label for arrange'
  },
  help_kbd_undo: {
    defaultMessage: '<b>Undo:</b>',
    description: 'Keyboard shortcut label for undo'
  },
  help_kbd_info: {
    defaultMessage: 'These keyboard shortcuts only work when the app is active. On the canvas editor, Canva\'s native keyboard shortcuts apply.',
    description: 'Info message about keyboard shortcuts'
  }
});