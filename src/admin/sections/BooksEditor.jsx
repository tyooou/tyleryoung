import ListEditor from "./ListEditor.jsx";

const FIELDS = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "isbn", label: "ISBN" },
  { key: "dateStarted", label: "Date started (YYYY-MM-DD)" },
  { key: "dateCompleted", label: "Date completed (YYYY-MM-DD, blank = in progress)" },
];

const EMPTY_ITEM = { isbn: "", title: "", author: "", dateStarted: "", dateCompleted: "" };

function BooksEditor() {
  return (
    <ListEditor
      type="books"
      title="Books"
      description="Books shown on the Books page."
      fields={FIELDS}
      emptyItem={EMPTY_ITEM}
      getSummary={(item) => item.title || "New book"}
    />
  );
}

export default BooksEditor;
