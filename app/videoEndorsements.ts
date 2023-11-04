import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TicketInput {
    userId: string;
    videoId: string;
}

async function giveTicket(input: TicketInput): Promise<void> {
    const { userId, videoId } = input;

    // Fetch all roles of the user
    const userGameRoles = await prisma.userGameRole.findMany({ where: { userId: userId } });

    // Calculate the total power from all roles
    const totalPower = userGameRoles.reduce((sum, role) => sum + role.power, 0);

    // Create a Ticket entry with the total power and update the video's total ticket value
    await prisma.$transaction([
        prisma.ticket.create({
            data: {
                userId: userId,
                videoId: videoId,
                totalPower: totalPower,
                roleTickets: {
                    create: userGameRoles.map(role => ({
                        roleType: role.type,
                        power: role.power
                    }))
                }
            }
        }),
        prisma.video.update({
            where: { id: videoId },
            data: { totalTickets: { increment: totalPower } },
        })
    ]);
}


async function removeTicket(input: TicketInput): Promise<void> {
    const { userId, videoId } = input;

    const ticket = await prisma.ticket.findFirst({
        where: { userId: userId, videoId: videoId },
    });

    if (!ticket) {
        throw new Error('Ticket not found');
    }

    const totalPower = ticket.totalPower;

    // Delete the ticket and its associated role tickets
    await prisma.ticket.delete({
        where: { id: ticket.id },
    });

    // Update the video's total ticket value
    await prisma.video.update({
        where: { id: videoId },
        data: { totalTickets: { decrement: totalPower } },
    });
}

// Export the functions for use in other parts of your application
export { giveTicket, removeTicket };
