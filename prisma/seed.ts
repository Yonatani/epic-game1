import { PrismaClient, User } from '@prisma/client';
import {createPassword, getUserImages} from '#tests/db-utils.ts';

const prisma = new PrismaClient();

interface UserRoleData {
	name: string;
	description: string;
}

export async function clearDatabase(): Promise<void> {
	const entities = [
		{ name: 'user', action: () => prisma.user.deleteMany() },
		{ name: 'userRole', action: () => prisma.userRole.deleteMany() },
		{ name: 'userGameRole', action: () => prisma.userGameRole.deleteMany() },
		{ name: 'note', action: () => prisma.note.deleteMany() },
		{ name: 'password', action: () => prisma.password.deleteMany() },
		// { name: 'ticket', action: () => prisma.ticket.deleteMany() },
		// { name: 'comment', action: () => prisma.comment.deleteMany() },
		// { name: 'report', action: () => prisma.report.deleteMany() },
		// { name: 'noteImage', action: () => prisma.noteImage.deleteMany() },
		// { name: 'userImage', action: () => prisma.userImage.deleteMany() },
		// { name: 'session', action: () => prisma.session.deleteMany() },
		// { name: 'connection', action: () => prisma.connection.deleteMany() },
		// { name: 'role', action: () => prisma.role.deleteMany() },
		// { name: 'verification', action: () => prisma.verification.deleteMany() },
	];

	for (const entity of entities) {
		try {
			await entity.action();
		} catch (error) {
			console.error(`Error deleting from ${entity.name}:`);
		}
	}
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
			notes: {
				create: {
					title: 'First note',
					content: 'This is the first note created.',
				},
			},
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
						// @ts-ignore
						type: 'artist',
						power: gamePowerArtist
					}, {
						// @ts-ignore
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
