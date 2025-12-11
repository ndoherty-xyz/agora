import { AuthProvider } from "@/components/auth-context";
import { AuthorTooltip } from "@/components/author-tooltip";
import { Editor } from "@/components/editor";

export default function Home() {
  return (
    <AuthProvider>
      <Editor />
      <AuthorTooltip />
    </AuthProvider>
  );
}
