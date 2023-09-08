import { PrismaClient, User } from '@prisma/client';
import {createPassword, getUserImages} from '#tests/db-utils.ts';

const prisma = new PrismaClient();

interface RoleData {
	name: string;
	description: string;
}

async function clearDatabase(): Promise<void> {
	await prisma.ticket.deleteMany();
	await prisma.comment.deleteMany();
	await prisma.report.deleteMany();
	await prisma.noteImage.deleteMany();
	await prisma.note.deleteMany();
	await prisma.userRole.deleteMany();
	await prisma.gameRole.deleteMany();
	await prisma.userImage.deleteMany();
	await prisma.password.deleteMany();
	await prisma.session.deleteMany();
	await prisma.connection.deleteMany();
	await prisma.user.deleteMany();
	await prisma.role.deleteMany();
	await prisma.verification.deleteMany();
}

async function createRoleIfNotExists(roleData: RoleData): Promise<string> {
	let existingRole = await prisma.role.findUnique({
		where: { name: roleData.name },
	});

	if (!existingRole) {
		existingRole = await prisma.role.create({ data: roleData });
	}

	return existingRole.id;
}

async function main(): Promise<void> {
	await clearDatabase();

	const userImages =  await getUserImages()

	const totalUsers = 10;
	const roleIds: Record<string, string> = {};
	const rolesData: RoleData[] = [
		{ name: 'admin', description: 'Admin role with full permissions' },
		{ name: 'editor', description: 'Editor role with limited permissions' },
		{ name: 'user', description: 'Regular user with minimal permissions' },
	];

	for (let role of rolesData) {
		roleIds[role.name] = await createRoleIfNotExists(role);
	}

	const gameRoleIds: Record<string, string> = {};
	const gameRolesData: RoleData[] = [
		{ name: 'artist', description: 'Artist role with full artist power' },
		{ name: 'critic', description: 'Critic role with full critic power' },
	];

	for (let role of gameRolesData) {
		gameRoleIds[role.name] = await createRoleIfNotExists(role);
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
					// @ts-ignore
					type: 'artist',
					roleId: gameRoleIds.artist,
					power: gamePowerArtist
				}, {
					// @ts-ignore
					type: 'critic',
					roleId: gameRoleIds.critic,
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
						roleId: gameRoleIds.artist,
						power: gamePowerArtist
					}, {
						// @ts-ignore
						type: 'critic',
						roleId: gameRoleIds.critic,
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
