import {faker} from "@faker-js/faker";
import { PrismaClient } from '@prisma/client';
import {giveTicket} from "#app/videoEndorsements.ts";
import { createPassword, getUserImages, type ImageType } from '#tests/db-utils.ts';


const prisma = new PrismaClient();

interface UserRoleData {
	name: string;
	description: string;
}

const rolesData: UserRoleData[] = [
	{ name: 'admin', description: 'Admin role with full permissions' },
	{ name: 'editor', description: 'Editor role with limited permissions' },
	{ name: 'user', description: 'Regular user with minimal permissions' },
];

export async function clearDatabase(outsourcePrisma?: PrismaClient): Promise<void> {
	console.log('123123', !!outsourcePrisma)
	const prismaSource = outsourcePrisma || prisma;
	// Start by deleting the tables with foreign keys
	await prismaSource.videoComment.deleteMany();
	await prismaSource.roleTicket.deleteMany();
	await prismaSource.ticket.deleteMany();
	await prismaSource.report.deleteMany();
	await prismaSource.userGameRole.deleteMany();
	await prismaSource.userRole.deleteMany();
	await prismaSource.permission.deleteMany();
	await prismaSource.userImage.deleteMany();
	await prismaSource.session.deleteMany();
	await prismaSource.password.deleteMany();
	await prismaSource.verification.deleteMany();
	await prismaSource.connection.deleteMany();

	// Then delete the tables being referenced
	await prismaSource.video.deleteMany();
	await prismaSource.user.deleteMany();
	await prismaSource.role.deleteMany();
}


async function createUserRoleIfNotExists(roleData: UserRoleData): Promise<string> {
	try {
		let existingRole;

		try {
			existingRole = await prisma.role.findUnique({
				where: { name: roleData.name },
			});
		} catch (error) {
			throw error;
		}

		if (!existingRole) {
			existingRole = await prisma.role.create({ data: roleData });
		}

		return existingRole.id;
	} catch (error) {
		console.error(`Error creating role ${roleData.name}:`);
		throw error;
	}
}


// shortcut to delete DB
// async function mainDeleteAll(): Promise<void> {
// 	await clearDatabase();
// }

// const createKodyUser = async (roleIds) => {
// 	const gamePowerArtist = Math.floor(Math.random() * 100);
// 	const gamePowerCritic = Math.floor(Math.random() * 100);
//
// 	const kody: User = await prisma.user.create({
// 		data: {
// 			name: 'Kody Web',
// 			email: 'kody@web.com',
// 			username: 'kody',
// 			password: { create: createPassword('kodylovesyou') },
// 			roles: { create: { roleId: roleIds.admin } },
// 			gameRoles: {
// 				create: [{
// 					type: 'artist',
// 					power: gamePowerArtist
// 				}, {
// 					type: 'critic',
// 					power: gamePowerCritic
// 				}]
// 			},
// 		},
// 	});
//
// 	console.log('Kody User Created:', kody);
// }

const createVideoForArtist = async (userId: string) => {
	try {
		await prisma.video.create({
			data: {
				title: faker.lorem.sentence(),
				description: faker.lorem.paragraph(),
				videoLink: faker.internet.url(),
				contentType: "video/mp4", // or any other default format
				ownerId: userId
			}
		});
	} catch (error) {
		console.error('Error creating video for artist:', error);
	}
}

const createCommentForCritic = async (userId: string)=> {
	try {
		// Fetch a random video
		const randomVideo = await prisma.video.findFirst({
			where: {
				ownerId: {
					not: userId // Ensure the critic doesn't comment on their own video
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		if (randomVideo) {
			await prisma.videoComment.create({
				data: {
					content: faker.lorem.sentence(),
					userId: userId,
					videoId: randomVideo.id
				}
			});
		}
	} catch (error) {
		console.error('Error creating comment for critic:', error);
	}
}

async function giveMockTicket(): Promise<void> {
	// Fetch all user IDs
	const allUserIds = await prisma.user.findMany({
		select: {
			id: true
		}
	});

	// Randomly select a user ID
	const randomUserId = allUserIds[Math.floor(Math.random() * allUserIds.length)].id;

	// Fetch the user with the selected ID
	const randomUser = await prisma.user.findUnique({
		where: {
			id: randomUserId
		}
	});

	if (!randomUser) {
		console.error('Random user not found.');
		return;
	}


	// Fetch a random video not owned by the selected user
	const randomVideo = await prisma.video.findFirst({
		where: {
			ownerId: {
				not: randomUser.id
			}
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	if (randomUser && randomVideo) {
		await giveTicket({ userId: randomUser.id, videoId: randomVideo.id });
	}
}


const createRandomUser = async (index: number ,userImages: ImageType[], roleIds: Record<string, any>) => {
	const userData = {
		email: `user${index}@example.com`,
		username: `user${index}`,
		name: `User ${index}`,
	};

	const roleName = index === 0 ? 'admin' : index <= 2 ? 'editor' : 'user';
	//const gameRoleType = index === 0 ? 'artist' : index <= 2 ? 'critic' : null;
	const gamePowerArtist = Math.floor(Math.random() * 100);
	const gamePowerCritic = Math.floor(Math.random() * 100);

	const createdUser = await prisma.user.create({
		include: { gameRoles: true },
		data: {
			...userData,
			password: { create: createPassword('zazazaza') },
			image: { create: userImages[index % userImages.length] },
			roles: { create: { roleId: roleIds[roleName] } },
			gameRoles: {
				create: [{
					type: 'artist',
					power: gamePowerArtist
				}, {
					type: 'critic',
					power: gamePowerCritic
				}]
			},
		},
	}).catch((e) => {
		console.error('Error creating a user:', e);
	});

	// Check game roles and create content for artists and critics
	if(createdUser && createdUser.gameRoles) {
		for (let gameRole of createdUser.gameRoles) {
			if (gameRole.type === 'artist' && gameRole.power > 0) {
				await createVideoForArtist(createdUser.id);
			} else if (gameRole.type === 'critic' && gameRole.power > 1) {
				await createCommentForCritic(createdUser.id);
			}
		}
	}

};

async function main(): Promise<void> {
	try {
		await clearDatabase();
	} catch (error) {
		console.error('Error clearing database:', error);
	}

	// Creating user roles
	const roleIds: Record<string, string> = {};
	for (let role of rolesData) {
		roleIds[role.name] = await createUserRoleIfNotExists(role);
	}

	console.log('User roles were created! (admin, editor, user)');

	// Creating mock users
	const userImages =  await getUserImages()
	const totalUsers = 10;
	for (let index = 0; index < totalUsers; index++) {
		await createRandomUser(index, userImages, roleIds);
	}

	console.log(`${totalUsers} mock users were created! this also created some videos and comments`);

	// Creating mock tickets
	const totalTickets = 20; // or any number you prefer
	for (let index = 0; index < totalTickets; index++) {
		await giveMockTicket();
	}

	console.log(`${totalTickets} mock tickets were created!`);
}

main()
	.catch((e) => {
		throw e;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
