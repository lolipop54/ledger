import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TestRegex {
    public static void main(String[] args) {
        String msgBody1 = "您的借记卡账户长城电子借记卡，于03月15日网上支付支取人民币50.00元,交易后余额392.93【中国银行】";
        String msgBody2 = "尾号5166卡3月20日11:41手机银行支出(信使费)30元，余额489.57元。【工商银行】";
        
        Pattern EXPENSE_PATTERN = Pattern.compile("(?:于)?(\\d{1,2}月\\d{1,2}日).*?(支取|消费|支出).*?(?:人民币)?([0-9.]+)(?:元)?");
        
        Matcher matcher1 = EXPENSE_PATTERN.matcher(msgBody1);
        if (matcher1.find()) {
            System.out.println("Match 1 found!");
            System.out.println("Group 1 (Date): " + matcher1.group(1));
            System.out.println("Group 2 (Action): " + matcher1.group(2));
            System.out.println("Group 3 (Amount): " + matcher1.group(3));
        } else {
            System.out.println("No match 1.");
        }

        Matcher matcher2 = EXPENSE_PATTERN.matcher(msgBody2);
        if (matcher2.find()) {
            System.out.println("Match 2 found!");
            System.out.println("Group 1 (Date): " + matcher2.group(1));
            System.out.println("Group 2 (Action): " + matcher2.group(2));
            System.out.println("Group 3 (Amount): " + matcher2.group(3));
        } else {
            System.out.println("No match 2.");
        }
    }
}