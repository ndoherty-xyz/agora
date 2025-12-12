import { AuthProvider } from "@/components/auth-context";
import { AuthorTooltip } from "@/components/author-tooltip";
import { Editor } from "@/components/editor";

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-scroll">
      <div className="py-[48px] md:py-[108px] px-[24px] sm:px-[48px] md:px-[256px]">
        <AuthProvider>
          <Editor />
          <AuthorTooltip />
        </AuthProvider>
      </div>
    </div>
  );
}
