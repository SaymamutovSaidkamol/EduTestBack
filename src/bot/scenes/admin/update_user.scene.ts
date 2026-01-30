import { Wizard, WizardStep, Ctx, On } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('admin-update-user')
export class AdminUpdateUserScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: any) {
        try {
            const users = await this.prisma.user.findMany({
                take: 50
            });

            if (users.length === 0) {
                await ctx.reply("Hali foydalanuvchilar yo'q.");
                await this.backToMenu(ctx);
                return ctx.scene.leave();
            }

            const buttons = users.map(user => [
                Markup.button.callback(`${user.firstName} ${user.lastName} (${user.role})`, `select_user_${user.id}`)
            ]);
            buttons.push([Markup.button.callback('❌ Bekor qilish', 'cancel')]);

            await ctx.replyWithHTML(
                "<b>Tahrirlash uchun foydalanuvchini tanlang:</b>",
                Markup.inlineKeyboard(buttons)
            );
            ctx.wizard.next();
        } catch (error) {
            await ctx.reply("Foydalanuvchilarni yuklashda xatolik.");
            ctx.scene.leave();
        }
    }

    @WizardStep(2)
    async onUserSelect(@Ctx() ctx: any) {
        if (!ctx.callbackQuery) {
            await ctx.reply("Iltimos, foydalanuvchini tanlang.");
            return;
        }

        const data = ctx.callbackQuery.data;
        if (data === 'cancel') {
            await ctx.reply("Amal bekor qilindi.");
            await this.backToMenu(ctx);
            ctx.scene.leave();
            return;
        }

        const userId = data.replace('select_user_', '');
        ctx.wizard.state.targetUserId = userId;
        await ctx.answerCbQuery();

        await ctx.editMessageText(
            "Qaysi maydonni tahrirlamoqchisiz?",
            Markup.inlineKeyboard([
                [Markup.button.callback('Ism', 'field_firstName')],
                [Markup.button.callback('Familya', 'field_lastName')],
                [Markup.button.callback('Rol', 'field_role')],
                [Markup.button.callback('❌ Bekor qilish', 'cancel')]
            ])
        );
        ctx.wizard.next();
    }

    @WizardStep(3)
    async onFieldSelect(@Ctx() ctx: any) {
        if (!ctx.callbackQuery) {
            await ctx.reply("Iltimos, maydonni tanlang.");
            return;
        }

        const data = ctx.callbackQuery.data;
        if (data === 'cancel') {
            await ctx.reply("Amal bekor qilindi.");
            await this.backToMenu(ctx);
            ctx.scene.leave();
            return;
        }

        const field = data.replace('field_', '');
        ctx.wizard.state.updateField = field;
        await ctx.answerCbQuery();

        if (field === 'role') {
            await ctx.editMessageText(
                "Yangi rolni tanlang:",
                Markup.inlineKeyboard([
                    [Markup.button.callback('ADMIN', 'val_ADMIN')],
                    [Markup.button.callback('TEACHER', 'val_TEACHER')],
                    [Markup.button.callback('STUDENT', 'val_STUDENT')],
                    [Markup.button.callback('❌ Bekor qilish', 'cancel')]
                ])
            );
        } else {
            await ctx.reply(`Yangi ${field} qiymatini kiriting:`);
        }
        ctx.wizard.next();
    }

    @WizardStep(4)
    async onNewValue(@Ctx() ctx: any) {
        let newValue: string;
        const field = ctx.wizard.state.updateField;
        const userId = ctx.wizard.state.targetUserId;

        if (field === 'role') {
            if (!ctx.callbackQuery) {
                await ctx.reply("Iltimos, rolni tanlang.");
                return;
            }
            if (ctx.callbackQuery.data === 'cancel') {
                await ctx.reply("Amal bekor qilindi.");
                await this.backToMenu(ctx);
                ctx.scene.leave();
                return;
            }
            newValue = ctx.callbackQuery.data.replace('val_', '');
            await ctx.answerCbQuery();
        } else {
            if (!ctx.message?.text) {
                await ctx.reply("Iltimos, matn kiriting.");
                return;
            }
            newValue = ctx.message.text;
        }

        try {
            const data: any = {};
            data[field] = newValue;

            await this.prisma.user.update({
                where: { id: userId },
                data: data
            });

            await ctx.reply(`Foydalanuvchi muvaffaqiyatli yangilandi! (${field} -> ${newValue})`);
        } catch (error) {
            await ctx.reply("Yangilashda xatolik yuz berdi.");
        }

        await this.backToMenu(ctx);
        ctx.scene.leave();
    }

    private async backToMenu(ctx: any) {
        await ctx.reply('Userlar bo\'limi:', Markup.keyboard([
            ["Userlarni ko'rish", 'Userni aktivlashtirish'],
            ['Excelga eksport', 'Statistika'],
            ['Userni tahrirlash', 'Orqaga']
        ]).resize());
    }
}
