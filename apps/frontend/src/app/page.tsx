import { AuthProvider } from "@/components/auth-context";
import { AuthorTooltip } from "@/components/author-tooltip";
import { Editor } from "@/components/editor";

export default function Home() {
  return (
    <div className="h-screen w-screen">
      <div className="py-[48px] lg:py-[108px] px-[24px] sm:px-[48px] lg:px-[256px]">
        <AuthProvider>
          <Editor />
          <AuthorTooltip />
        </AuthProvider>
      </div>
    </div>
  );
}
