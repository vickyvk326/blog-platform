import { prisma } from '@/lib/prisma';

const getUsers = async () => {
  const users = await prisma.user.findMany();
  return users;
};

const getUser = async (id: string) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  return user;
};

export { getUsers, getUser };
