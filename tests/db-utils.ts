import fs from 'node:fs';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { UniqueEnforcer } from 'enforce-unique';
import { getPasswordHash } from '#app/utils/auth.server.ts';
import { prisma } from '#app/utils/db.server.ts';

const uniqueUsernameEnforcer = new UniqueEnforcer();

export function createUser() {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();

	const username = uniqueUsernameEnforcer
		.enforce(() => {
			return (
				faker.string.alphanumeric({ length: 2 }) +
				'_' +
				faker.internet.userName({
					firstName: firstName.toLowerCase(),
					lastName: lastName.toLowerCase(),
				})
			);
		})
		.slice(0, 20)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '_');
	return {
		username,
		name: `${firstName} ${lastName}`,
		email: `${username}@example.com`,
	};
}

export function createPassword(password: string = faker.internet.password()) {
	return {
		hash: bcrypt.hashSync(password, 10),
	};
}

export const insertedUsers = new Set<string>();

export async function insertNewUser({
										username,
										password,
										email,
									}: { username?: string; password?: string; email?: string } = {}) {

	const userData = createUser();
	username ??= userData.username;
	password ??= userData.username; // Note: This means the password defaults to the username if not provided
	email ??= userData.email;

// Step 1: Create the user.
	const user = await prisma.user.create({
		select: { id: true, name: true, username: true, email: true },
		data: {
			...userData,
			email,
			username,
			password: { create: { hash: await getPasswordHash(password) } },
		},
	});

// Step 2: Establish the user-role connection.

// Fetch the role ID for the 'user' role
	const role = await prisma.role.findUnique({
		where: {
			name: 'user',
		},
		select: {
			id: true,
		},
	});

// Make sure the role exists
	if (!role) {
		throw new Error("Role 'user' not found in database.");
	}

// Create the user-role connection
	await prisma.userRole.create({
		data: {
			userId: user.id,
			roleId: role.id,
		},
	});

	console.log(`Created User: ${user.username} | Password: ${password}`);
	insertedUsers.add(user.id);
	return user as typeof user & { name: string };


	console.log(`Created User: ${user.username} | Password: ${password}`);
	insertedUsers.add(user.id);
	return user as typeof user & { name: string };
}

let noteImages: Array<Awaited<ReturnType<typeof img>>> | undefined;
export async function getNoteImages() {
	if (noteImages) return noteImages;

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
			altText: 'an office full of laptops and other office equipment that look like it was abandoned in a rush out of the building in an emergency years ago.',
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
			altText: 'someone at the end of a cry session who\'s starting to feel a little better.',
			filepath: './tests/fixtures/images/notes/9.png',
		}),
	]);

	return noteImages;
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

// The type for the userImages variable
let userImages: Array<Awaited<ReturnType<typeof img>>> | undefined;

export async function getUserImages(): Promise<Array<Awaited<ReturnType<typeof img>>>> {
	if (userImages) return userImages;

	userImages = await Promise.all(
		Array.from({ length: 10 }, (_, index) =>
			img({ filepath: `./tests/fixtures/images/user/${index}.jpg` })
		)
	);

	return userImages;
}

export async function img({ altText, filepath }: ImgParams): Promise<ImgReturnType> {
	return {
		altText,
		contentType: filepath.endsWith('.png') ? 'image/png' : 'image/jpeg',
		blob: await fs.promises.readFile(filepath),
	};
}

// Utility type definition
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

