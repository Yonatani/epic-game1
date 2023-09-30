import {faker} from "@faker-js/faker";
import { PrismaClient } from '@prisma/client';
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

export async function clearDatabase() {
	await prisma.userImage.deleteMany();
	await prisma.session.deleteMany();
	await prisma.password.deleteMany();
	await prisma.verification.deleteMany();
	await prisma.connection.deleteMany();
	await prisma.ticket.deleteMany();
	await prisma.report.deleteMany();
	await prisma.videoComment.deleteMany();
	await prisma.userGameRole.deleteMany();
	await prisma.userRole.deleteMany();
	await prisma.permission.deleteMany();
	await prisma.role.deleteMany();
	await prisma.user.deleteMany();
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
		console.error('Error clearing database:');
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
}

main()
	.catch((e) => {
		throw e;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
