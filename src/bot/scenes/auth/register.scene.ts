import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Wizard('create_product')
export class RegisterScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        await ctx.reply(
            "Salom! Siz saytda ro'yxatdan o'tganmisiz?",
            Markup.keyboard([
                ["Ha, ro'yxatdan o'tganman"],
                ["Yo'q, ro'yxatdan o'tmaganman"],
                ["Orqaga"]
            ]).resize(),
        );
        ctx.wizard.next();
    }

    @WizardStep(2)
    async onChoosePath(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === "Ha, ro'yxatdan o'tganman") {
            await ctx.reply("Emailingizni kiriting:", Markup.keyboard([['Orqaga']]).resize());
            ctx.wizard.selectStep(2);
        } else if (text === "Yo'q, ro'yxatdan o'tmaganman") {
            await ctx.reply("Ismingizni kiriting:", Markup.keyboard([['Orqaga']]).resize());
            ctx.wizard.selectStep(5);
        } else {
            return ctx.scene.leave();
        }
    }

    @WizardStep(3)
    async onGetLoginEmail(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === 'Orqaga') return ctx.scene.leave();
        const user = await this.prisma.user.findUnique({ where: { email: text } });
        if (!user) {
            await ctx.reply("❌ Foydalanuvchi topilmadi. Qaytadan kiriting (yoki /start):");
            return;
        }
        ctx.scene.state['login_user'] = user;
        await ctx.reply("Parolingizni kiriting:");
        ctx.wizard.next();
    }

    @WizardStep(4)
    async onGetLoginPassword(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === 'Orqaga') return ctx.scene.leave();
        const user = ctx.scene.state['login_user'];
        if (!bcrypt.compareSync(text, user.password)) {
            await ctx.reply("❌ Parol noto'g'ri. Qaytadan urinib ko'ring:");
            return;
        }
        await ctx.reply("Kontaktni yuboring:", Markup.keyboard([[Markup.button.contactRequest('📞 Yuborish')], ['Orqaga']]).resize());
        ctx.wizard.next();
    }

    @WizardStep(5)
    async onGetLoginPhone(@Ctx() ctx: Scenes.WizardContext) {
        const msg = ctx.message as any;
        if (msg?.text === 'Orqaga') return ctx.scene.leave();
        if (!msg?.contact) return;
        const user = ctx.scene.state['login_user'];
        await this.prisma.user.update({
            where: { id: user.id },
            data: { telegramId: String(ctx.from?.id), phone: msg.contact.phone_number }
        });
        await ctx.reply("✅ Tayyor!");
        return ctx.scene.leave();
    }

    @WizardStep(6)
    async onGetRegFirstName(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === 'Orqaga') return ctx.scene.leave();
        ctx.scene.state['reg_firstName'] = text;
        await ctx.reply("Familyangiz:");
        ctx.wizard.next();
    }

    @WizardStep(7)
    async onGetRegLastName(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === 'Orqaga') return ctx.scene.leave();
        ctx.scene.state['reg_lastName'] = text;
        await ctx.reply("Email:");
        ctx.wizard.next();
    }

    @WizardStep(8)
    async onGetRegEmail(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === 'Orqaga') return ctx.scene.leave();
        ctx.scene.state['reg_email'] = text;
        await ctx.reply("Parol:");
        ctx.wizard.next();
    }

    @WizardStep(9)
    async onGetRegPassword(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === 'Orqaga') return ctx.scene.leave();
        ctx.scene.state['reg_password'] = bcrypt.hashSync(text, 10);
        await ctx.reply("Rasm yuboring (yoki 'Skip'):", Markup.keyboard([['Skip'], ['Orqaga']]).resize());
        ctx.wizard.next();
    }

    @WizardStep(10)
    async onGetRegImage(@Ctx() ctx: Scenes.WizardContext) {
        const msg = ctx.message as any;
        if (msg?.text === 'Orqaga') return ctx.scene.leave();
        let image = 'no-image.png';
        if (msg?.photo) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileUrl = await ctx.telegram.getFileLink(fileId);
            image = fileUrl.toString();
        }
        ctx.scene.state['reg_image'] = image;
        await ctx.reply("Kontakt:", Markup.keyboard([[Markup.button.contactRequest('📞 Yuborish')], ['Orqaga']]).resize());
        ctx.wizard.next();
    }

    @WizardStep(11)
    async onGetRegPhone(@Ctx() ctx: Scenes.WizardContext) {
        const msg = ctx.message as any;
        if (msg?.text === 'Orqaga') return ctx.scene.leave();
        if (!msg?.contact) return;
        ctx.scene.state['reg_phone'] = msg.contact.phone_number;
        await ctx.reply("Rol:", Markup.keyboard([['STUDENT', 'TEACHER'], ['Orqaga']]).resize());
        ctx.wizard.next();
    }

    @WizardStep(12)
    async onGetRegRole(@Ctx() ctx: Scenes.WizardContext) {
        const text = (ctx.message as any)?.text;
        if (text === 'Orqaga') return ctx.scene.leave();
        if (text !== 'STUDENT' && text !== 'TEACHER') return;
        const s = ctx.scene.state;
        try {
            await this.prisma.user.create({
                data: {
                    firstName: s['reg_firstName'],
                    lastName: s['reg_lastName'],
                    email: s['reg_email'],
                    password: s['reg_password'],
                    image: s['reg_image'],
                    phone: s['reg_phone'],
                    telegramId: String(ctx.from?.id),
                    role: text as any,
                    isActive: true
                }
            });
            await ctx.reply("✅ Ro'yxatdan o'tdingiz!");
            return ctx.scene.leave();
        } catch (e) {
            await ctx.reply("Xatolik bo'ldi. Balki email banddir.");
            return ctx.scene.leave();
        }
    }
}
