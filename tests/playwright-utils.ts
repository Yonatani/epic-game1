import { test, type Page } from '@playwright/test'
import * as setCookieParser from 'set-cookie-parser'
import { getSessionExpirationDate, sessionKey } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { sessionStorage } from '#app/utils/session.server.ts'
import { insertNewUser, insertedUsers } from './db-utils.ts'

export * from './db-utils.ts'

export async function loginPage({
	page,
	user: givenUser,
}: {
	page: Page
	user?: { id: string }
}) {
	const user = givenUser
		? await prisma.user.findUniqueOrThrow({
				where: { id: givenUser.id },
				select: {
					id: true,
					email: true,
					username: true,
					name: true,
				},
		  })
		: await insertNewUser()
	const session = await prisma.session.create({
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.id,
		},
		select: { id: true },
	})

	const cookieSession = await sessionStorage.getSession()
	cookieSession.set(sessionKey, session.id)
	const cookieConfig = setCookieParser.parseString(
		await sessionStorage.commitSession(cookieSession),
	) as any
	await page.context().addCookies([{ ...cookieConfig, domain: 'localhost' }])
	return user as typeof user & { name: string }
}

/**
 * This allows you to wait for something (like an email to be available).
 *
 * It calls the callback every 50ms until it returns a value (and does not throw
 * an error). After the timeout, it will throw the last error that was thrown or
 * throw the error message provided as a fallback
 */
export async function waitFor<ReturnValue>(
	cb: () => ReturnValue | Promise<ReturnValue>,
	{
		errorMessage,
		timeout = 5000,
	}: { errorMessage?: string; timeout?: number } = {},
) {
	const endTime = Date.now() + timeout
	let lastError: unknown = new Error(errorMessage)
	while (Date.now() < endTime) {
		try {
			const response = await cb()
			if (response) return response
		} catch (e: unknown) {
			lastError = e
		}
		await new Promise(r => setTimeout(r, 100))
	}
	throw lastError
}

export const deleteUsers = async (users: Set<string>) => {
	try {
		await prisma.userGameRole.deleteMany({
			where: { userId: { in: Array.from(users) } },
		});
	} catch (error) {
		console.error("Error deleting from userGameRole:");
	}

	try {
		await prisma.ticket.deleteMany({
			where: { userId: { in: Array.from(users) } },
		});
	} catch (error) {
		console.error("Error deleting from ticket:");
	}

	try {
		await prisma.videoComment.deleteMany({
			where: { userId: { in: Array.from(users) } },
		});
	} catch (error) {
		console.error("Error deleting from comment:");
	}

	try {
		await prisma.noteComment.deleteMany({
			where: { userId: { in: Array.from(users) } },
		});
	} catch (error) {
		console.error("Error deleting from comment:");
	}

	try {
		await prisma.report.deleteMany({
			where: { userId: { in: Array.from(users) } },
		});
	} catch (error) {
		console.error("Error deleting from report:");
	}

	try {
		await prisma.userRole.deleteMany({
			where: { userId: { in: Array.from(users) } },
		});
	} catch (error) {
		console.error("Error deleting from userRole:");
	}

	try {
		await prisma.user.deleteMany({
			where: { id: { in: Array.from(users) } },
		});
	} catch (error) {
		console.error("Error deleting from user:");
	}
}


test.afterEach(async () => {
	await deleteUsers(insertedUsers);
	insertedUsers.clear();
})
