import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "admin@test.com";

  await prisma.user.delete({ where: { email } }).catch(() => {
    //void
  });

  const hashedPassword = await bcrypt.hash("testing123", 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  const primaryList = await prisma.list.create({
    data: {
      name: "First list",
      userId: user.id
    }
  })


  const secondaryList = await prisma.list.create({
    data: {
      name: "secondary list",
      userId: user.id
    }
  })

  await prisma.item.create({
    data: {
      name: "My first item",

      listId: primaryList.id,
    }
  })


  await prisma.item.create({
    data: {
      name: "My second item",

      listId: secondaryList.id,
    }
  })

}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
