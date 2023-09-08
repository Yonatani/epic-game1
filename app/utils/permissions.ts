import { PrismaClient } from '@prisma/client';
import { json } from '@remix-run/node';
import {useUser} from "#app/utils/user.js";

const prisma = new PrismaClient();

type PermissionString = string;
type UserId = string;

async function requireUserId(request: Request): Promise<UserId> {
	// I'm assuming that the `requireUserId` function returns the userId string or throws an error.
	// Adjust this mockup as necessary.
	return "mockUserId";
}

export async function requireUserWithPermission(request: Request, permission: PermissionString): Promise<UserId> {
	const userId = await requireUserId(request);
	const permissionData = parsePermissionString(permission);

	const user = await prisma.user.findFirst({
		select: { id: true },
		where: {
			id: userId,
			roles: {
				some: {
					permissions: {
						some: {
							...permissionData,
							access: permissionData.access
								? { in: permissionData.access }
								: undefined,
						},
					},
				},
			},
		},
	});

	if (!user) {
		throw json(
			{
				error: 'Unauthorized',
				requiredPermission: permissionData,
				message: `Unauthorized: required permissions: ${permission}`,
			},
			{ status: 403 },
		);
	}

	return user.id;
}

export async function requireUserWithRole(request: Request, name: string): Promise<UserId> {
	const userId = await requireUserId(request);

	const user = await prisma.user.findFirst({
		select: { id: true },
		where: {
			id: userId,
			roles: {
				some: {
					role: {
						name: name,
					},
				},
			},
		},
	});

	if (!user) {
		throw json(
			{
				error: 'Unauthorized',
				requiredRole: name,
				message: `Unauthorized: required role: ${name}`,
			},
			{ status: 403 },
		);
	}

	return user.id;
}

type Action = 'create' | 'read' | 'update' | 'delete';
type Entity = 'user' | 'note';
type Access = 'own' | 'any' | 'own,any' | 'any,own';

function parsePermissionString(permissionString: PermissionString): { action: Action, entity: Entity, access: Access[] } {
	const [action, entity, access] = permissionString.split(':');

	return {
		action: action as Action,
		entity: entity as Entity,
		access: access ? (access.split(',') as Access[]) : [],
	};
}

export function userHasPermission(user: Pick<ReturnType<typeof useUser>, 'roles'> | null | undefined, permission: PermissionString): boolean {
	if (!user) return false;

	const { action, entity, access } = parsePermissionString(permission);

	return user.roles?.some(userRole =>
		userRole.permissions?.some(
			permission =>
				permission.entity === entity &&
				permission.action === action &&
				(!access || access.includes(permission.access)),
		),
	) ?? false;
}

export function userHasRole(user: Pick<ReturnType<typeof useUser>, 'roles'> | null | undefined, role: string): boolean {
	if (!user) return false;

	return user.roles?.some(userRole => userRole.role.name === role) ?? false;
}
