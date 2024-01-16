import fs from 'node:fs'
import { faker } from '@faker-js/faker'
import { type PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UniqueEnforcer } from 'enforce-unique'
import {prisma} from "#app/utils/db.server.ts";
// import {clearDatabase} from "#prisma/seed.js";

const uniqueUsernameEnforcer = new UniqueEnforcer()

export function createUser() {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	const username = uniqueUsernameEnforcer
		.enforce(() => {
			return (
				faker.string.alphanumeric({ length: 2 }) +
				'_' +
				faker.internet.userName({
					firstName: firstName.toLowerCase(),
					lastName: lastName.toLowerCase(),
				})
			)
		})
		.slice(0, 20)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '_')
	return {
		username,
		name: `${firstName} ${lastName}`,
		email: `${username}@example.com`,
	}
}

export function createPassword(password: string = faker.internet.password()) {
	return {
		hash: bcrypt.hashSync(password, 10),
	}
}

let noteImages: Array<Awaited<ReturnType<typeof img>>> | undefined
export async function getNoteImages() {
	if (noteImages) return noteImages

	noteImages = await Promise.all([
		img({
			altText: 'a nice country house',
			filepath: './tests/fixtures/images/notes/0.png',
		}),
		img({
			altText: 'a city scape',
			filepath: './tests/fixtures/images/notes/1.png',
		}),
		img({
			altText: 'a sunrise',
			filepath: './tests/fixtures/images/notes/2.png',
		}),
		img({
			altText: 'a group of friends',
			filepath: './tests/fixtures/images/notes/3.png',
		}),
		img({
			altText: 'friends being inclusive of someone who looks lonely',
			filepath: './tests/fixtures/images/notes/4.png',
		}),
		img({
			altText: 'an illustration of a hot air balloon',
			filepath: './tests/fixtures/images/notes/5.png',
		}),
		img({
			altText:
				'an office full of laptops and other office equipment that look like it was abandoned in a rush out of the building in an emergency years ago.',
			filepath: './tests/fixtures/images/notes/6.png',
		}),
		img({
			altText: 'a rusty lock',
			filepath: './tests/fixtures/images/notes/7.png',
		}),
		img({
			altText: 'something very happy in nature',
			filepath: './tests/fixtures/images/notes/8.png',
		}),
		img({
			altText: `someone at the end of a cry session who's starting to feel a little better.`,
			filepath: './tests/fixtures/images/notes/9.png',
		}),
	])

	return noteImages
}

export async function cleanupDb(prisma: PrismaClient) {
	const tables = await prisma.$queryRaw<
		{ name: string }[]
	>`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';`

	await prisma.$transaction([
		// Disable FK constraints to avoid relation conflicts during deletion
		prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`),
		// Delete all rows from each table, preserving table structures
		...tables.map(({ name }) =>
			prisma.$executeRawUnsafe(`DELETE from "${name}"`),
		),
		prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`),
	])
}

export type ImageType = Awaited<ReturnType<typeof img>>;

let userImages: ImageType[] | undefined;

export async function getUserImages(): Promise<ImageType[]> {
	if (userImages) return userImages;

	userImages = await Promise.all(
		Array.from({ length: 10 }, (_, index) =>
			img({ filepath: `./tests/fixtures/images/user/${index}.jpg` })
		)
	);

	return userImages;
}

// Define the parameters for the img function
type ImgParams = {
	altText?: string;
	filepath: string;
};

// Define the return type of the img function
type ImgReturnType = {
	altText?: string;
	contentType: string;
	blob: Buffer; // The return type of fs.promises.readFile() is Buffer
};

export async function img({ altText, filepath }: ImgParams): Promise<ImgReturnType> {
	return {
		altText,
		contentType: filepath.endsWith('.png') ? 'image/png' : 'image/jpeg',
		blob: await fs.promises.readFile(filepath),
	};
}

export async function deleteUserByUsername(username: string): Promise<void> {
	// Start a transaction to delete the user and all related records
	await prisma.$transaction(async (prisma) => {
		// Find user by username first
		const user = await prisma.user.findUnique({
			where: { username },
		});

		if (!user) {
			throw new Error('User not found');
		}

		const userId = user.id;

		// The following deleteMany calls can be omitted if `onDelete: Cascade` is working as expected.
		await prisma.session.deleteMany({ where: { userId } });
		await prisma.ticket.deleteMany({ where: { userId } });
		await prisma.report.deleteMany({ where: { userId } });
		await prisma.userRole.deleteMany({ where: { userId } });
		await prisma.connection.deleteMany({ where: { userId } });
		await prisma.password.deleteMany({ where: { userId } });
		await prisma.userImage.deleteMany({ where: { userId } });
		await prisma.video.deleteMany({ where: { ownerId: userId } });
		await prisma.note.deleteMany({ where: { ownerId: userId } });

		// Finally, delete the user
		await prisma.user.delete({ where: { id: userId } });
	});

	console.log(`User with username ${username} and all related records have been deleted.`);
}

export async function deleteUser(userId: string): Promise<void> {
	// Start a transaction to delete the user and all related records
	await prisma.$transaction(async (prisma) => {
		// You may not need these if `onDelete: Cascade` is working as expected
		// but they're here as an explicit way to show deletions.
		try {
			await prisma.session.deleteMany({ where: { userId } });

		await prisma.ticket.deleteMany({ where: { userId } });
		await prisma.report.deleteMany({ where: { userId } });
		await prisma.userRole.deleteMany({ where: { userId } });
		// there can be several connections, and while testing they might already be deleted or used by another test
		try {
			await prisma.connection.deleteMany({ where: { userId } });
		} catch (e) {
			console.log('bboooomm', e)
		}
		await prisma.password.deleteMany({ where: { userId } });
		await prisma.userImage.deleteMany({ where: { userId } });

		// Deleting videos will also delete related video comments and reports due to cascading
		await prisma.video.deleteMany({ where: { ownerId: userId } });

		// Deleting notes will also delete related note comments, images, and reports due to cascading
		await prisma.note.deleteMany({ where: { ownerId: userId } });

		// Finally, delete the user
		await prisma.user.delete({ where: { id: userId } });
		} catch (e) {
			console.log(e)
		}
	});

	console.log(`User with ID ${userId} and all related records have been deleted.`);
}
