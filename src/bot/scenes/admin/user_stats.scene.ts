import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

@Wizard('admin-user-stats')
export class AdminUserStatsScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        try {
            const users = await this.prisma.user.findMany({
                where: { results: { some: { status: 'FINISHED' } } },
                include: {
                    results: {
                        where: { status: 'FINISHED' },
                        include: {
                            test: { include: { questions: true } }
                        }
                    }
                }
            });

            const tests = await this.prisma.test.findMany({
                include: { results: { where: { status: 'FINISHED' } } }
            });

            if (users.length === 0) {
                await ctx.reply("Hali test topshirib yakunlagan foydalanuvchi yo'q.");
            } else {
                // 1. User Statistics
                let userMsg = "<b>📊 Foydalanuvchilar statistikasi (Yakunlanganlar):</b>\n\n";
                for (const user of users) {
                    let totalScore = 0;
                    let totalPossible = 0;

                    userMsg += `👤 <b>${user.firstName} ${user.lastName}</b>\n`;

                    user.results.forEach(res => {
                        const totalQ = res.test.questions.length;
                        const correct = res.score ?? 0;
                        const percent = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;

                        totalScore += correct;
                        totalPossible += totalQ;

                        userMsg += `  📝 ${res.test.title}: ${correct}/${totalQ} (${percent}%)\n`;
                    });

                    const overallPercent = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
                    userMsg += `  🏆 Umumiy ko'rsatkich: ${overallPercent}%\n`;
                    userMsg += `----------------------------\n`;

                    if (userMsg.length > 3500) {
                        await ctx.replyWithHTML(userMsg);
                        userMsg = "";
                    }
                }
                if (userMsg) await ctx.replyWithHTML(userMsg);

                // 2. Most Attempted Tests
                let testMsg = "\n<b>🔥 Eng ko'p topshirilgan testlar:</b>\n\n";
                const sortedTests = tests
                    .sort((a, b) => b.results.length - a.results.length)
                    .slice(0, 10);

                sortedTests.forEach((test, idx) => {
                    testMsg += `${idx + 1}. ${test.title} — ${test.results.length} marta\n`;
                });

                await ctx.replyWithHTML(testMsg);
            }

        } catch (error) {
            console.error('Admin stats error:', error);
            await ctx.reply("Statistikani yuklashda xatolik.");
        }

        await this.backToMenu(ctx);
        return ctx.scene.leave();
    }

    private async backToMenu(ctx: any) {
        await ctx.reply('Userlar bo\'limi:', Markup.keyboard([
            ["Userlarni ko'rish", 'Userni aktivlashtirish'],
            ['Excelga eksport', 'Statistika'],
            ['Userni tahrirlash', 'Orqaga']
        ]).resize());
    }
}
