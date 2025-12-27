import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: any) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await context.params;

    if (!courseId) {
        return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }

    try {
        const decodedCourseId = decodeURIComponent(courseId);
        const messages = await prisma.message.findMany({
            where: { courseId: decodedCourseId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
            take: 50,
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("FETCH_MESSAGES_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request, context: any) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await context.params;
    if (!courseId) {
        return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }

    try {
        const decodedCourseId = decodeURIComponent(courseId);
        const { content } = await req.json();

        if (!content || content.trim() === "") {
            return NextResponse.json({ error: "Message content required" }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                content,
                courseId: decodedCourseId,
                userId: session.user.id,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error("SEND_MESSAGE_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
