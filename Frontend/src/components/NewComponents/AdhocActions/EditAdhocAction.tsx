import { Breadcrumbs, Text, TextInput, Button, Select, Alert, Group } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { getActionById, updateCorrectiveAction } from "../../../services/CorrectiveActionService";
import { useEffect, useState } from "react";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import TextEditor from "../../UtilityComp/TextEditor";
import { isValidRichText } from "../../../utility/OtherUtilities";
import { IconInfoCircle } from "@tabler/icons-react";
import CaHelp from "../../LaggingIndicator/CorrectiveAction/CaHelp";

const EditAdhocAction = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm({
    initialValues: {
      actionName: '',
      assignedEmployeeId: '',
      deadline: new Date(),
      description: '',
      ownerId: null as any,
      departmentId: null as any,
      id: null as any,
    },
    validate: {
      actionName: (value) => (value.trim().length < 5 ? 'Title must be at least 5 characters' : null),
      description: (value) => (isValidRichText(value) ? null : 'Description must be at least 10 characters'),
    },
  });

  useEffect(() => {
    getEmployeeDropdown()
      .then((res) => setEmployees(res))
      .catch((_err) => { })
      .finally(() => { });

    if (!id) return;
    getActionById(id)
      .then((res) => {
        const statusUpper = String(res?.status || '').toUpperCase();
        if (statusUpper !== 'PENDING') {
          errorNotification('Only pending ideas can be edited.');
          navigate(`/adhoc-actions/adhocAction-details/${id}`);
          return;
        }
        form.setValues({
          ...res,
          id: res.id,
          actionName: res.actionName || '',
          assignedEmployeeId: res.assignedEmployeeId ? String(res.assignedEmployeeId) : '',
          deadline: res.deadline ? new Date(res.deadline) : new Date(),
          description: res.description || '',
          ownerId: res.ownerId ?? null,
          departmentId: res.departmentId ?? null,
        });
      })
      .catch((err) => {
        errorNotification(err.response?.data?.errorMessage || 'Failed to load idea');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = () => {
    dispatch(showOverlay());

    const payload = {
      ...form.values,
      id: form.values.id ?? id,
      actionName: form.values.actionName,
      assignedEmployeeId: form.values.assignedEmployeeId ? Number(form.values.assignedEmployeeId) : null,
      deadline: form.values.deadline instanceof Date
        ? form.values.deadline.toISOString().split('T')[0]
        : form.values.deadline,
      description: form.values.description,
      ownerId: form.values.ownerId,
      departmentId: form.values.departmentId,
    };
    updateCorrectiveAction(payload)
      .then((_res) => {
        successNotification('Improvement idea updated successfully');
        navigate('/adhoc-actions');
      })
      .catch((err) => {
        errorNotification(err.response?.data?.errorMessage || 'Something went wrong');
      })
      .finally(() => {
        dispatch(hideOverlay());
      });
  };

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-3xl font-medium text-blue-500 bg-gradient-to-r from-primary to-secondary bg-clip-text">
            Edit Improvement Idea
          </div>
          <Breadcrumbs mt="xs">
            <Link className="hover:!underline" to="/">
              <Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text>
            </Link>
            <Link className="hover:!underline" to="/adhoc-actions">
              <Text variant="gradient" className="hover:!underline cursor-pointer">Improvement Ideas</Text>
            </Link>
            <Text variant="gradient">Edit Improvement Idea</Text>
          </Breadcrumbs>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TextInput
                  withAsterisk
                  label="Idea Title"
                  placeholder="Enter Idea title"
                  {...form.getInputProps('actionName')}
                />

                <Select
                  data={employees.map(emp => ({ value: String(emp.id), label: emp.name }))}
                  label="Assigned To"
                  placeholder="Person responsible"
                  {...form.getInputProps('assignedEmployeeId')}
                />
              </div>

              <TextEditor form={form} id="description" title="Idea Description" withAsterisk />

              <DateInput
                label="Due Date"
                placeholder="Pick a date"
                minDate={new Date()}
                {...form.getInputProps('deadline')}
              />

              <Alert
                color="indigo"
                variant="light"
                radius="md"
                icon={<IconInfoCircle size={18} />}
                className="border border-indigo-200"
              >
                <div className="flex flex-col gap-1">
                  <Text size="sm" c="indigo.9" fw={600}>Edit Notice</Text>
                  <Text size="sm" c="dimmed">Updating this idea will modify its core details. History and progress remain intact.</Text>
                  <Group gap="xs" mt={4}>
                    <Text size="xs" c="indigo.7">Idea ID: {String(id)}</Text>
                  </Group>
                </div>
              </Alert>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button variant="default" onClick={() => navigate('/adhoc-actions')}>Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white" disabled={loading}>Update Idea</Button>
              </div>
            </form>
          </div>
          <div className="">
            <CaHelp />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAdhocAction;
