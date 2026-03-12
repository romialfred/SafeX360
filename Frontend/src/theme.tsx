import { colorsTuple, createTheme } from '@mantine/core';
export const theme = createTheme({
    colors: {
        // primary: colorsTuple("#5D87FF")
        primary: colorsTuple("#38BDF8"),
        secondary: colorsTuple("#10B981"),
    },
    components: {
        TextInput: { defaultProps: { size: 'md' } },
        Select: { defaultProps: { size: 'md', comboboxProps: { shadow: 'xl' } } },
        NumberInput: { defaultProps: { size: 'md' } },
        PasswordInput: { defaultProps: { size: 'md' } },
        Textarea: { defaultProps: { size: 'md' } },
        DateTimePicker: { defaultProps: { size: 'md' } },
        Checkbox: { defaultProps: { size: 'md' } },
        MultiSelect: { defaultProps: { size: 'md', comboboxProps: { shadow: 'xl' } } },
        DatePickerInput: { defaultProps: { size: 'md' } },
        TimeInput: { defaultProps: { size: 'md' } },
        DateInput: { defaultProps: { size: 'md' } },
        FileInput: { defaultProps: { size: 'md' } },
        Button: { defaultProps: { radius: 'md' } },
    },
    primaryColor: "primary",
    cursorType: 'pointer',
    defaultGradient: {
        from: 'primary',
        to: 'secondary',
        deg: 132,
    },


})
