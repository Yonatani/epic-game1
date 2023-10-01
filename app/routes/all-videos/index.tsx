import {
	json,
 type V2_MetaFunction } from '@remix-run/node'

import {useLoaderData} from "@remix-run/react";
import { prisma } from '../../utils/db.server.ts'

export const meta: V2_MetaFunction = () => [{ title: 'Epic Notes' }];

export async function loader() {
	const videos = await prisma.video.findMany({
		select: {
			id: true,
			title: true,
			description: true,
			videoLink: true,
			thumbnail: true,
			comments: {
				select: {
					id: true,
					content: true,
					user: {
						select: {
							username: true
						}
					}
				}
			}
		}
	});

	return json(
		{videos},
	)
}
export default function Index() {
	const data = useLoaderData<typeof loader>();
	console.log('data11', data)

	return (
		<div className="max-w-4xl mx-auto mt-8 px-4">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{data.videos.map((video) => (
					<div key={video.id} className="p-4 border rounded shadow">
						<h2 className="text-xl font-bold">{video.title}</h2>
						<video width="320" height="240" controls>
							<source src={video.videoLink} />
							Your browser does not support the video tag.
						</video>
						<p>{video.description}</p>
						<div className="mt-4">
							<h3 className="text-lg font-semibold">Comments:</h3>
							<ul>
								{video.comments.map((comment) => (
									<li key={comment.id}>
										{comment.user.username}: {comment.content}
									</li>
								))}
							</ul>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

