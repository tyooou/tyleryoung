import ListEditor from "./ListEditor.jsx";

const FIELDS = [
  { key: "role", label: "Role" },
  { key: "company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "link", label: "Link (URL)" },
  { key: "start", label: "Start date (YYYY-MM-DD)" },
  { key: "end", label: "End date (YYYY-MM-DD, blank = Present)" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "techStack", label: "Tech stack (comma-separated icon slugs)", type: "list" },
];

const EMPTY_ITEM = {
  role: "",
  company: "",
  location: "",
  description: "",
  start: "",
  end: "",
  link: "",
  techStack: [],
};

function ExperienceEditor() {
  return (
    <ListEditor
      type="experience"
      title="Experience"
      description="Work experience entries shown on the Experience page."
      fields={FIELDS}
      emptyItem={EMPTY_ITEM}
      getSummary={(item) => `${item.role || "New role"} @ ${item.company || "…"}`}
    />
  );
}

export default ExperienceEditor;
