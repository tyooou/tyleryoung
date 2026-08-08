import ListEditor from "./ListEditor.jsx";

const FIELDS = [
  { key: "name", label: "Name" },
  { key: "link", label: "Link (URL)" },
];

const EMPTY_ITEM = { name: "", link: "" };

function FriendsEditor() {
  return (
    <ListEditor
      type="friends"
      title="Friends"
      description="People linked from the Friends page."
      fields={FIELDS}
      emptyItem={EMPTY_ITEM}
      getSummary={(item) => item.name || "New friend"}
    />
  );
}

export default FriendsEditor;
