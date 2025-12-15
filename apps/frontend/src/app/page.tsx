import { AuthProvider } from "@/components/auth-context";
import { AuthorTooltip } from "@/components/editor/author-tooltip";
import { Editor } from "@/components/editor/editor";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <div className="h-screen w-screen">
      <div className="py-[48px] pt-[108px] lg:py-[108px] px-[24px] sm:px-[48px] lg:px-[256px]">
        <AuthProvider>
          <Header />
          <Editor />
          <AuthorTooltip />
        </AuthProvider>
      </div>
    </div>
  );
}
