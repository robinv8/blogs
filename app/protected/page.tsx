import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

import { getNestedFriendLinks } from "@/utils/jobs/queryblog";

const prisma = new PrismaClient();

export default async function ProtectedPage() {
	const supabase = createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/sign-in");
	}

	const friendLinks = await getNestedFriendLinks("https://yufan.me/");

  const urls = friendLinks.map(link => link.url);

  const blogs = await prisma.blog.findMany({
    where: {
      url: {
        in: urls,
      },
    },
  });

  console.log(blogs);

  const newBlogs = friendLinks.filter(link => !blogs.some(blog => blog.url === link.url));

  console.log(newBlogs);

  const createBlogs = await prisma.blog.createMany({
    data: newBlogs.map(blog => ({
      title: blog.title,
      url: blog.url,
    })),
  });


	return (
		<div className="flex-1 w-full flex flex-col gap-12">
			<div className="w-full">
				<div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
					<InfoIcon size="16" strokeWidth={2} />
					This is a protected page that you can only see as an authenticated
					user
				</div>
			</div>
			<div className="flex flex-col gap-2 items-start">
				<h2 className="font-bold text-2xl mb-4">Your user details</h2>
				<pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
					{JSON.stringify(user, null, 2)}
				</pre>
			</div>
			<div>
				<h2 className="font-bold text-2xl mb-4">Next steps</h2>
				<FetchDataSteps />
			</div>
		</div>
	);
}
