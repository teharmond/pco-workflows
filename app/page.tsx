import { getAuthStatus } from "@/lib/pco-client";
import { LoginButton } from "@/components/login-button";
import { WorkflowsList } from "@/components/workflows-list";
import { AuthRefresh } from "@/components/auth-refresh";
import {
  Cards,
  Flowforthsvg,
  RaycastIcon,
  NpmIcon,
  ChurchkitIcon,
  Parable,
} from "@/components/icons";
import Link from "next/link";

const projects = [
  {
    svg: <Flowforthsvg className="h-3.5 w-3.5" />,
    title: "Flowforth",
    link: "https://flowforth.co",
  },
  {
    svg: <RaycastIcon className="h-3.5 w-3.5" />,
    title: "PCO Docs Raycast Extension",
    link: "https://www.raycast.com/thomas.harmond/planning-center-api-docs",
  },
  {
    svg: <NpmIcon className="h-3.5 w-3.5" />,
    title: "PCO NPM Package",
    link: "https://github.com/teharmond/planning-center-api",
    status: "work-in-progress",
  },
  {
    svg: <ChurchkitIcon className="h-3.5 w-3.5" />,
    title: "churchkit",
    link: "https://churchkit.io",
    status: "work-in-progress",
  },
];

export default async function Page() {
  const authStatus = await getAuthStatus();

  if (authStatus === "needs_refresh") {
    return <AuthRefresh />;
  }

  const isLoggedIn = authStatus === "authenticated";

  return (
    <main className="min-h-screen px-4">
      {isLoggedIn ? (
        <div className="max-w-4xl mx-auto py-6">
          <div className="flex items-center  justify-between mb-8">
            <h1 className=" font-semibold tracking-tight">Kanban Workflows</h1>
            <LoginButton isLoggedIn={isLoggedIn} />
          </div>
          <WorkflowsList />
        </div>
      ) : (
        <div className=" md:py-32 py-6  max-w-xl mx-auto">
          <div className="flex w-full flex-col gap-8 mb-4">
            <div className="flex px-4 mb-2 md:mb-8 justify-between items-center">
              <Cards className="h-7 w-7" />

              <LoginButton isLoggedIn={isLoggedIn} />
            </div>
            <div className=" flex px-4 flex-col gap-2 items-start">
              <span className="font-semibold tracking-tight">
                Kanban Workflows
              </span>
              <p className="text-foreground/90 text-sm">
                A simple way to visualize and manage your Planning Center
                workflows.
              </p>
            </div>
            <div className=" flex px-4 flex-col gap-2 items-start">
              <span className="font-semibold tracking-tight">About</span>
              <p className="text-foreground/90 text-sm">
                This isn&apos;t a &quot;product&quot;. It doesn&apos;t cost
                money, it doesn&apos;t store your data, and it isn&apos;t filled
                with fancy features. It&apos;s simply a way to visualize and
                manage your Planning Center workflows and cards in the form of a
                kanban board.
              </p>
            </div>
            <div className=" flex  flex-col gap-2 items-start w-full">
              <span className="font-semibold tracking-tight px-4">
                Other Projects
              </span>
              <p className="text-foreground/90 px-4 text-sm">
                Feel free to check out some other projects I&apos;m a part of.
              </p>
              <div className="flex flex-col px-2 w-full">
                {projects.map((project, index) => (
                  <a href={project.link} key={index} target="_blank">
                    <div className="flex cursor-pointer items-center gap-2 text-sm rounded-md p-1 px-2 font-medium transition-colors duration-200 hover:bg-blue-100 hover:text-blue-600">
                      {project.svg}
                      {project.title}
                      {project.status === "work-in-progress" && (
                        <p className="text-muted-foreground text-xs font-light">
                          (work in progress)
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>

              <p className="text-foreground/90 px-4 text-sm mt-4">
                And here&apos;s a cool project a friend is working on.
              </p>
              <div className="flex flex-col px-2 w-full">
                <a href="https://getparable.io/" target="_blank">
                  <div className="flex cursor-pointer items-center gap-2 text-sm rounded-md p-1 px-2 font-medium transition-colors duration-200 hover:bg-blue-100 hover:text-blue-600">
                    <Parable className="h-3.5 w-3.5" />
                    Parable
                  </div>
                </a>
              </div>
            </div>
            <hr />
            <div className="flex justify-between items-center px-4">
              <p className=" text-muted-foreground text-xs">
                Forever in beta (probably)
              </p>
              <p className="text-muted-foreground text-xs">
                <Link href="mailto:hey@thomasharmond.com">
                  hey@thomasharmond.com
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
