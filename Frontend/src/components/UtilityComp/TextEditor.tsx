import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { BubbleMenu, FloatingMenu, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { RichTextEditor } from '@mantine/tiptap';
import { IconHeading } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Text } from '@mantine/core';

const TextEditor = ({ form, id, title, withAsterisk }: any) => {
    useEffect(() => {
        if (editor && editor.isEmpty) {
            editor.commands.setContent(form.getInputProps(id).value);
        }
        // editor?.commands.setContent(form.getInputProps(id).value);
    }, [form.getInputProps(id).value])
    const editor = useEditor({
        extensions: [StarterKit, Underline, Highlight],
        content: form.getInputProps(id).value,
        onUpdate({ editor }) {
            form.setFieldValue(id, editor.getHTML());
        },
    });

    return (
        <div className='[&_.mantine-RichTextEditor-content]:min-h-[100px]'>

            <h3 className="text-gray-800 mb-1 flex gap-1">{title} {withAsterisk && <Text color='red'>*</Text>}</h3>
            <Text color='red'>{form.getInputProps(id).error}</Text>
            <RichTextEditor editor={editor} variant="default">
                <BubbleMenu editor={editor}>
                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Bold />
                        <RichTextEditor.Italic />
                        <RichTextEditor.Link />
                    </RichTextEditor.ControlsGroup>
                </BubbleMenu>
                <FloatingMenu editor={editor}>
                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.H1 />
                        <RichTextEditor.H2 />
                        <RichTextEditor.BulletList />
                    </RichTextEditor.ControlsGroup>
                </FloatingMenu>
                <RichTextEditor.Toolbar sticky stickyOffset={30}>
                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.H3 icon={IconHeading} />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Bold />
                        <RichTextEditor.Italic />
                        <RichTextEditor.Underline />
                        <RichTextEditor.Strikethrough />
                        <RichTextEditor.ClearFormatting />
                        <RichTextEditor.Highlight />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.BulletList />
                        <RichTextEditor.OrderedList />
                    </RichTextEditor.ControlsGroup>

                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.AlignLeft />
                        <RichTextEditor.AlignCenter />
                        <RichTextEditor.AlignJustify />
                        <RichTextEditor.AlignRight />
                    </RichTextEditor.ControlsGroup>
                    <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Undo />
                        <RichTextEditor.Redo />
                    </RichTextEditor.ControlsGroup>
                </RichTextEditor.Toolbar>

                <RichTextEditor.Content />
            </RichTextEditor>
        </div>
    );
}

export default TextEditor;