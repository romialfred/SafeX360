import { IconAlertTriangle, IconBuilding, IconCircleCheck, IconFlask2 } from "@tabler/icons-react";
import { TextInput, Textarea, Select, Button, Breadcrumbs, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDispatch } from "react-redux";
import { hideOverlay, showOverlay } from "../../../slices/OverlaySlice";
import { errorNotification, successNotification } from "../../../utility/NotificationUtility";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllDepartments } from "../../../services/HrmsService";
import { GetAllWorkProcess } from "../../../services/WorkProcessService";
import { getEmployeeDropdown } from "../../../services/EmployeeService";
import { getChemicalRiskByID, updateChemicalRisk } from "../../../services/RiskIdentificationService";

const EditChemicalRisk = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [departments, setDepartments] = useState<any[]>([]);
  const [workProcesses, setWorkProcesses] = useState<any[]>([]);
  const [emps, setEmps] = useState<any[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchWorkProcesses();
    fetchEmployees();
  }, []);

  const fetchEmployees = () => {
    getEmployeeDropdown()
      .then((data) => setEmps(data))
      .catch((error) => errorNotification(error.response?.data?.errorMessage || "Failed to fetch employees"));
  };

  const fetchDepartments = () => {
    getAllDepartments()
      .then((data) => setDepartments(data.map((d: any) => ({ value: String(d.id), label: d.name }))))
      .catch((error) => errorNotification(error.response?.data?.errorMessage || "Failed to fetch departments"));
  };

  const fetchWorkProcesses = () => {
    GetAllWorkProcess({})
      .then((data) => setWorkProcesses(data.map((wp: any) => ({ value: String(wp.id), label: wp.name }))))
      .catch((error) => errorNotification(error.response?.data?.errorMessage || "Failed to fetch work processes"));
  };

  const classifications = [
    "Flammable",
    "Toxic",
    "Corrosive",
    "Oxidizing",
    "Explosive",
    "Irritant",
    "Carcinogenic",
    "Mutagenic",
    "Reproductive Toxin",
  ];

  const hazardSources = [
    "Storage",
    "Handling",
    "Transport",
    "Mixing",
    "Heating",
    "Disposal",
    "Maintenance",
    "Emergency Response",
  ];

  // Right-side section guide (same pattern as identification form)
  const sectionFields = {
    "general-info": {
      title: "General Information",
      icon: IconBuilding,
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
      tips: [
        "Confirm the latest identification date for audit trails.",
        "Ensure the department and process still reflect where the chemical is handled.",
        "Keep the owner field aligned with who is accountable for mitigation actions.",
      ],
    },
    "hazard-info": {
      title: "Hazard Information",
      icon: IconFlask2,
      color: "text-orange-600",
      bgColor: "bg-orange-50 border-orange-200",
      tips: [
        "Verify the chemical name and CAS number against the latest SDS.",
        "Update classification if new hazard data has been published.",
        "Describe how the chemical is used today, including changes to mixtures or processes.",
      ],
    },
    "risk-description": {
      title: "Risk Description",
      icon: IconAlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
      tips: [
        "Refresh the narrative so it reflects current tasks and exposure scenarios.",
        "Note improvements or gaps discovered since the last review.",
        "Adjust the consequence statement if severity or likelihood has changed.",
      ],
    },
  } as const;

  const SectionHelpPanel = ({ sectionKey }: { sectionKey: string }) => {
    const section = sectionFields[sectionKey as keyof typeof sectionFields];
    if (!section) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 w-80 flex-shrink-0">
        <div className="flex items-center mb-6">
          <div className={`p-2 rounded-lg ${section.bgColor} mr-3`}>
            <section.icon className={`w-6 h-6 ${section.color}`} />
          </div>
          <h3 className="text-lg text-gray-900">{section.title}</h3>
        </div>
        <div className={`rounded-lg p-4 ${section.bgColor}`}>
          <div className="space-y-3 text-sm text-gray-700">
            {section.tips.map((tip, index) => (
              <div key={index} className="flex items-start">
                <div className={`w-2 h-2 rounded-full ${section.color.replace('text-', 'bg-')} mr-3 mt-2 flex-shrink-0`} />
                <div>{tip}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const form = useForm({
    initialValues: {
      id: '',
      riskId: "",
      reviewDate: new Date(),
      departmentId: "",
      workProcessId: "",
      ownerId: "",
      chemicalName: "",
      casNumber: "",
      classification: "",
      hazardSource: "",
      methodOfUse: "",
      title: "",
      description: "",
      potentialConsequences: "",
      status: 'OPEN',
    },
  });

  useEffect(() => {
    if (!id) return;
    getChemicalRiskByID(id)
      .then((res) => {
        form.setValues({
          id: res.id,
          riskId: res.riskId || '',
          reviewDate: res.reviewDate ? new Date(res.reviewDate) : new Date(),
          departmentId: res.departmentId ? String(res.departmentId) : '',
          workProcessId: res.workProcessId ? String(res.workProcessId) : '',
          ownerId: res.ownerId ? String(res.ownerId) : '',
          chemicalName: res.chemicalName || '',
          casNumber: res.casNumber || '',
          classification: res.classification || '',
          hazardSource: res.hazardSource || '',
          methodOfUse: res.methodOfUse || '',
          title: res.title || '',
          description: res.description || '',
          potentialConsequences: res.potentialConsequences || '',
          status: res.status || 'OPEN',
        });
      })
      .catch((err) => {
        errorNotification(err.response?.data?.errorMessage || "Failed to load chemical risk");
        navigate('/chemical-register');
      });
  }, [id]);

  useEffect(() => {
    const chemical = (form.values.chemicalName || '').trim();
    const hazard = (form.values.hazardSource || '').trim();
    const method = (form.values.methodOfUse || '').trim();
    const derivedTitle = [chemical, hazard || method].filter(Boolean).join(' - ').slice(0, 120);
    if (derivedTitle && derivedTitle !== form.values.title) {
      form.setFieldValue('title', derivedTitle);
    } else if (!derivedTitle && form.values.title) {
      form.setFieldValue('title', '');
    }
  }, [form.values.chemicalName, form.values.hazardSource, form.values.methodOfUse]);

  const handleSubmit = () => {
    dispatch(showOverlay());
    const payload = {
      ...form.values,
      id: form.values.id || id,
      reviewDate: form.values.reviewDate
        ? (form.values.reviewDate as Date).toISOString().split("T")[0]
        : null,
      departmentId: form.values.departmentId ? Number(form.values.departmentId) : null,
      workProcessId: form.values.workProcessId ? Number(form.values.workProcessId) : null,
      ownerId: form.values.ownerId ? Number(form.values.ownerId) : null,
    } as any;

    updateChemicalRisk(payload)
      .then((_res) => {
        successNotification("Chemical risk updated successfully");
        navigate("/chemical-register");
      })
      .catch((err) => {
        errorNotification(err.response?.data?.errorMessage || "Something went wrong");
      })
      .finally(() => dispatch(hideOverlay()));
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-2xl font-semibold text-slate-900">Edit Chemical Risk</div>
          <Breadcrumbs mt="xs">
            <Link className="hover:!underline" to="/"><Text variant="gradient" className="hover:!underline cursor-pointer">Home</Text></Link>
            <Link className="hover:!underline" to="/chemical-register"><Text variant="gradient" className="hover:!underline cursor-pointer">Chemical Register</Text></Link>
            <Text variant="gradient">Edit Chemical Risk</Text>
          </Breadcrumbs>
        </div>
      </div>

      <div className="space-y-8">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          {/* General Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex gap-8">
              <div className="flex-1">
                <div className="flex items-center mb-6">
                  <IconBuilding className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg text-gray-900">General Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateInput required label="Date of Identification" {...form.getInputProps('reviewDate')} />
                  <Select required label="Department" placeholder="Select Department" data={departments} {...form.getInputProps('departmentId')} />
                  <Select required label="Work Process" placeholder="Select Work Process" data={workProcesses} {...form.getInputProps('workProcessId')} />
                  <Select label="Risk Owner" placeholder="Who is responsible?" data={emps.map((e: any) => ({ value: String(e.id), label: e.name }))} {...form.getInputProps('ownerId')} />
                </div>
              </div>
              <div className="w-80 flex-shrink-0">
                <SectionHelpPanel sectionKey="general-info" />
              </div>
            </div>
          </div>

          {/* Hazard Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex gap-8">
              <div className="flex-1">
                <div className="flex items-center mb-6">
                  <IconFlask2 className="w-6 h-6 text-orange-600 mr-3" />
                  <h3 className="text-lg text-gray-900">Hazard Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput required label="Chemical Name" placeholder="Official product name" {...form.getInputProps('chemicalName')} />
                  <TextInput label="CAS Number" placeholder="e.g., 67-64-1" {...form.getInputProps('casNumber')} />
                  <Select required label="Classification" placeholder="Select Classification" data={classifications} {...form.getInputProps('classification')} />
                  <Select required label="Hazard Source" placeholder="Select Hazard Source" data={hazardSources} {...form.getInputProps('hazardSource')} />
                  <Textarea required label="Method of Use" rows={3} placeholder="Describe how the chemical is applied or processed" {...form.getInputProps('methodOfUse')} />
                </div>
              </div>
              <div className="w-80 flex-shrink-0">
                <SectionHelpPanel sectionKey="hazard-info" />
              </div>
            </div>
          </div>

          {/* Risk Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex gap-8">
              <div className="flex-1">
                <div className="flex items-center mb-6">
                  <IconAlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                  <h3 className="text-lg text-gray-900">Risk Description</h3>
                </div>
                <div className="flex flex-col gap-5">
                  <Textarea label="Risk Description" placeholder="Describe the identified risk..." required rows={3} {...form.getInputProps('description')} />
                  <Textarea required label="Potential Consequences" rows={4} placeholder="List possible effects on health, safety, or environment" {...form.getInputProps('potentialConsequences')} />
                </div>
              </div>
              <div className="w-80 flex-shrink-0">
                <SectionHelpPanel sectionKey="risk-description" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-500">
              <IconCircleCheck className="w-4 h-4 mr-2" />
              Update the details and click save
            </div>
            <div className="flex space-x-4">
              <Button color="gray" onClick={() => navigate('/chemical-register')}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditChemicalRisk;
