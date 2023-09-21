import { PrismaClient, User } from '@prisma/client';
import {createPassword, getUserImages} from '#tests/db-utils.ts';

const prisma = new PrismaClient();

interface UserRoleData {
	name: string;
	description: string;
}

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

async function main(): Promise<void> {
	await clearDatabase();

	const userImages =  await getUserImages()

	const totalUsers = 10;
	const roleIds: Record<string, string> = {};
	const rolesData: UserRoleData[] = [
		{ name: 'admin', description: 'Admin role with full permissions' },
		{ name: 'editor', description: 'Editor role with limited permissions' },
		{ name: 'user', description: 'Regular user with minimal permissions' },
	];

	for (let role of rolesData) {
		roleIds[role.name] = await createUserRoleIfNotExists(role);
	}

	const gamePowerArtist = Math.floor(Math.random() * 100);
	const gamePowerCritic = Math.floor(Math.random() * 100);

	const kody: User = await prisma.user.create({
		data: {
			name: 'Kody Web',
			email: 'kody@web.com',
			username: 'kody',
			password: { create: createPassword('kodylovesyou') },
			roles: { create: { roleId: roleIds.admin } },
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
	});

	console.log('Kody User Created:', kody);

	for (let index = 0; index < totalUsers; index++) {
		const userData = {
			email: `user${index}@example.com`,
			username: `user${index}`,
			name: `User ${index}`,
		};

		const roleName = index === 0 ? 'admin' : index <= 2 ? 'editor' : 'user';
		//const gameRoleType = index === 0 ? 'artist' : index <= 2 ? 'critic' : null;
		const gamePowerArtist = Math.floor(Math.random() * 100);
		const gamePowerCritic = Math.floor(Math.random() * 100);

		await prisma.user.create({
			select: { id: true },
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
	}
}

main()
	.catch((e) => {
		throw e;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
