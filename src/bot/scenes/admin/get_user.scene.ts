import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('admin-get-user')
export class AdminGetUserScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        try {
            const users = await this.prisma.user.findMany();

            if (users.length === 0) {
                await ctx.reply("Hali foydalanuvchilar yo'q.");
            } else {
                let message = "<b>Barcha foydalanuvchilar:</b>\n\n";
                users.forEach((user, index) => {
                    let roleEmoji = '🧑‍🎓';
                    if (user.role === 'ADMIN') roleEmoji = '👮‍♂️';
                    else if (user.role === 'TEACHER') roleEmoji = '👨‍🏫';

                    message += `${index + 1}. ${user.firstName} ${user.lastName}\n`;
                    message += `ID: <code>${user.id}</code>\n`;
                    message += `Phone: ${user.phone || 'N/A'}\n`;
                    message += `Status: ${user.isActive ? '✅ Faol' : '❌ Nofaol'}\n`;
                    message += `Role: ${user.role} ${roleEmoji}\n`;
                    message += `----------------------------\n`;

                    if (message.length > 3500) {
                        ctx.replyWithHTML(message);
                        message = "";
                    }
                });

                if (message) {
                    await ctx.replyWithHTML(message);
                }
            }
        } catch (error) {
            console.error('Admin get users error:', error);
            await ctx.reply("Foydalanuvchilarni yuklashda xatolik yuz berdi.");
        }

        await this.backToMenu(ctx);
        return ctx.scene.leave();
    }

    private async backToMenu(ctx: any) {
        await ctx.reply('Userlar bo\'limi:', Markup.keyboard([
            ["Userlarni ko'rish", 'Userni aktivlashtirish'],
            ['Excelga eksport', 'Statistika'],
            ['Orqaga']
        ]).resize());
    }
}
