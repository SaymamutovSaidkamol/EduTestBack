import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('admin-activate-user')
export class AdminActivateUserScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.reply(
            "Aktivlashtirmoqchi bo'lgan foydalanuvchining ID sini kiriting:",
            Markup.keyboard([['Orqaga']]).resize()
        );
        ctx.wizard.next();
    }

    @WizardStep(2)
    async onGetId(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (!text || text === 'Orqaga') {
            await this.backToMenu(ctx);
            return ctx.scene.leave();
        }

        try {
            const user = await this.prisma.user.findUnique({ where: { id: text } });

            if (!user) {
                await ctx.reply("❌ Bunday ID ga ega foydalanuvchi topilmadi. Qaytadan kiriting:");
                return;
            }

            await this.prisma.user.update({
                where: { id: text },
                data: { isActive: true }
            });

            await ctx.reply(`✅ Foydalanuvchi ${user.firstName} muvaffaqiyatli faollashtirildi!`);
        } catch (error) {
            await ctx.reply("❌ Xatolik: ID noto'g'ri formatda.");
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
