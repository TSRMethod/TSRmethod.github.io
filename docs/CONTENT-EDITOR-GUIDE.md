# Editing the TSR website

A short guide to changing what the website says, without touching any code.

You do this through **Pages CMS**, a web page that lets you edit the site's
text and images in ordinary forms. You do not install anything.

---

## 1. Opening the editor

Go to **<https://app.pagescms.org>** in your browser.

Bookmark it — this is the only address you need.

## 2. Signing in

Click **Sign in with GitHub**.

You will need a free GitHub account, and someone from the group needs to have
given that account access to the website. If you get an error saying you have
no repositories, that is what is missing — ask the maintainer (see the last
section).

The first time you sign in, GitHub will ask you to approve access. That is
normal.

## 3. Choosing the website

After signing in you will see a list of projects. Choose:

**TSRMethod / TSRmethod.github.io**

You will then see the sections you can edit:

- **Method & tutorial pages**
- **Key Analysis & Visualization**
- **People**
- **Publications**
- **Software**
- **Home page**
- **Page introductions**
- **Site settings**

## 4. Editing a tutorial

1. Click **Method & tutorial pages**.
2. Click the page you want to change.
3. You will see a form. The large box at the bottom, **Page content**, is the
   body of the page.
4. Edit the text. There is a toolbar for headings, bold, lists, links, tables
   and code blocks — much like a word processor.
5. Click **Save**.

Things worth knowing:

- **Headings build the page menu.** The "On this page" list on the left of a
  tutorial is generated from the headings you write. Add a heading and it
  appears there automatically.
- **Code examples** should use the code block button so they are shown in the
  dark box with a "Copy" button, exactly as the existing ones are.
- **Tables** are for things like parameter lists and file formats. They scroll
  sideways on phones rather than squashing.

You will notice some things you cannot change — the page's web address, which
menu it sits under, and whether it is published. Those are deliberately not
editable here; see section 13.

## 5. Creating a new method draft

You can write up a brand new method yourself. You do not need a developer to
start one.

1. Click **Method & tutorial pages**.
2. Click **Add**.
3. Fill in the **Title** — for example `VCNN-TSR`. The web address is worked
   out from the title for you; there is nothing else to name.
4. Fill in the **Summary**, then write the page in the **Page content** box.
5. Add anything else you have: a figure, the paper details, the code
   repository, HPC instructions.
6. Click **Save**.

You can come back and keep editing it as often as you like.

> ### Creating a method does not publish it
>
> A new method is saved as a **draft**. It will not appear on the website, it
> will not appear in any menu, and it cannot be reached by anyone who tries
> the address.
>
> This is deliberate. It gives you somewhere to write up and revise the
> science without it going public before anyone has checked it.
>
> When the page is ready, tell the maintainer. They will review it, decide
> where it belongs in the site's menus, and make it public. At that point it
> appears on the website automatically.

You do not need to do anything to mark a page as a draft — a new page simply
starts that way.

## 6. Changing a figure

In the page form, find **Main illustration**.

1. Click the image box and either upload a new file or pick one already
   uploaded.
2. **Fill in the Alt text box.** This is a short sentence describing what the
   picture shows, and it is what a blind reader hears in place of the image.
   Describe the content, not the file. For example:

   > Triangles constructed between Cα atoms of a protein backbone, each
   > labelled with its computed integer key.

   A page cannot be made public without it, so please do not skip it. (A
   draft you are still working on will tolerate a missing description.)
3. The **Caption** is optional and is shown under the picture.

Uploaded images are stored together in one place, so they are easy to find
again later.

> ### You do not need to prepare images
>
> **Upload the best-quality picture you have.** Do not resize it, do not
> compress it, and do not try to convert it to WebP or anything else.
>
> The website does all of that by itself every time it rebuilds: it makes
> several smaller versions of each image and gives every visitor the one that
> suits their screen. A large photograph typically reaches visitors at a
> fraction of its original size. You will not see those versions and you do
> not need to think about them.
>
> The only thing to avoid is something enormous — a raw 40 MB file straight
> off a camera. Not because the website would be slow, but because the
> original is kept forever. A few megabytes is plenty for any picture here.

**If you change a picture, check the alt text underneath it.** The description
does not update itself, and one that describes the old picture is worse than
none — it tells a blind reader about something that is not there.

## 7. Adding or editing a publication

1. Click **Publications**.
2. To change one, click it. To add one, click **Add**.
3. Fill in the fields. Notes:
   - **Identifier** is used as the file name. Use lowercase letters and
     hyphens, for example `kondra-2021-tsr-method`. Once a publication exists,
     do not change it.
   - **Authors** is a list — click "Add" for each author, one name per entry,
     in the order they appear on the paper.
   - **DOI** should be just the number, like `10.1002/prot.26215`, with no
     `https://` in front. The link is built for you.
4. Click **Save**.

## 8. Updating a group member

1. Click **People**.
2. Click the person, or **Add** for someone new.
3. Fill in name, role, affiliation, biography, and optionally a photo and
   email address.
   - **Identifier** works the same way as for publications, e.g. `jane-smith`.
   - **Current or former member** moves someone between the two lists on the
     People page.
   - **Leave a field blank if you do not have it.** Do not type a placeholder
     like "TBC" or "none" — a blank field is simply not shown, whereas a
     placeholder would be published.
4. Click **Save**.

## 9. Changing the words on the home page

1. Click **Home page**.
2. Each section of the page is a group of fields — the opening section, the
   research vision, what TSR is, the methods, the software, the publications,
   the group, funding & support, and the closing invitation.
3. Rewrite whatever you like and click **Save**.

Two things are worth knowing.

**The lists look after themselves.** You will not find a place to list the
methods, the tools, the packages, the papers or the people, because none of
them are typed in here. They are read from the Method pages, the Software
collection, Publications and People. Publish a method and it appears on the
home page; add a paper and it becomes one of the three recent papers shown.

**Do not leave a field empty.** Every field here is text that appears on the
page, so a blank one would show as a gap or an unlabelled button. Emptying one
stops the website rebuilding, and the live site stays as it was until it is
filled in again.

**Page introductions** works the same way, for the wording on the Publications,
People, Software and Contact pages. The contact page has no field for the email
address — it uses the one in **Site settings**, so there is only ever one to
change.

### Research vision

Under **Home page** you will also find **Research vision** — the section near
the top of the home page with the scientific question in it. The heading, the
question, the two short sentences and the longer explanation behind the
"Read more" button are all editable here.

Two things to keep in mind. **Keep the question a question**: it is what the
research is trying to find out, and the site should not read as though the
answer is already known. And the **Expanded explanation** is a list — each
entry becomes one paragraph, so add a new entry rather than running everything
together in one box.

If you empty both the read-more label and every paragraph, the button
disappears and the section simply ends after the short text. That is fine and
supported. What is not allowed is one without the other — a button with
nothing behind it, or text nobody can reach — and the site will refuse to
rebuild until you fix it.

### Funding & support

Also under **Home page**. Everything in this section is editable here, so
**update it whenever an award changes** — no developer and no code change is
involved.

The section is in four parts.

**The two visible statements stay separate.** The **Primary funding
statement** is who funds the research, in a sentence. **Computing support** is
who provides the machines. LONI belongs in the second one: it supplies
high-performance computing, and describing it as a funder would be wrong.

**Funding awards** is a list of records, one per award. To add one:

1. Open **Home page**.
2. Go to **Funding & support**.
3. Go to **Funding awards**.
4. Click **Add award**.
5. Fill in **Funding organization**, **Investigator(s)** and **Grant / award
   number**.
6. Click **Save**.

Awards from the same organisation are gathered under one heading
automatically, so type the organisation the same way each time and do not
create a heading of your own. **No line breaks and no special formatting are
needed anywhere.** If you find yourself pressing Enter inside a box to make
something line up, it belongs in separate fields instead — add another award.

**Acknowledgments** is ordinary prose and stays separate from the award
records: an **Acknowledgments heading** and then one entry per paragraph.
Names of people to thank go here; award numbers go in **Funding awards**.

Everything behind the button is optional. Clear the awards, the
acknowledgments and the disclosure label together and the button disappears,
leaving the two statements. Awards without acknowledgments, and
acknowledgments without awards, both work. What is not allowed is a button
with nothing behind it, an award row with a blank field, or acknowledgment
paragraphs with no heading — the site refuses to rebuild until it is fixed,
and the live site stays as it was in the meantime.

You never need to edit JSON, and you cannot change where the section sits on
the page, how the expanding button behaves, or how any of it is laid out.
That is the site's job, and it stays the same however you reword the text.

## 10. Adding or editing software

1. Click **Software**.
2. Click a repository, or **Add** for a new one.
3. Fill in the fields. Notes:
   - **URL** is the whole change if a repository moves. The link, the
     `owner/name` shown on the card, and the connection to its tutorial pages
     all follow it.
   - **Category** picks the section it appears under on the software page.
   - **What it is** should be honest: `package` for something a user installs,
     `scripts` for research code that is run where it sits. It is printed on
     the entry.
   - **Issue tracker** is optional, and setting it is a promise. It puts a
     "Report a problem" link on the entry, so only fill it in for a repository
     whose issues somebody actually reads.
4. Click **Save**.

You will not find a field for "which tutorial does this go with". That is
worked out from the method pages, which already name the repositories they use.

## 11. Saving

Click **Save**. That is the whole process — there is no separate "publish"
step.

Your change is recorded straight away. The website itself is rebuilt
automatically afterwards.

## 12. How long until it appears

**Deployment is not switched on yet.** Once it is, expect roughly **one to two
minutes** between saving and the change appearing on
<https://tsrmethod.github.io>.

If it has been much longer than that, the automatic checks may have found a
problem with the change — see the last section.

Refresh the page in your browser if you still see the old version.

## 13. What you should not try to change here

Some things are hidden from the editor on purpose, because changing them would
break the site's addresses, its menus, or its scientific review process:

- a page's **web address**
- which **menu** a page appears under
- the **order** pages appear in the menu
- whether a method is **published or still under review**
- anything about how the site is built or deployed

**Publishing a method page that is still under review is deliberately not
possible from here.** Some pages are held back because their content has known
problems that need an author's decision — these are listed in the project's
`CONTENT-REVIEW.md`. Making one of them public is a job for the maintainer,
after the science has been checked.

If you need one of these changed, ask — it is a small job, it is just not a
safe one to do by accident.

## 14. If something goes wrong

The site checks every change before publishing it. If a change would break the
site, **the site does not break** — the previous version stays online and the
update simply does not appear.

The most common causes are:

- an image added without alt text
- a required box left empty

If your change has not appeared after a few minutes, or you see an error
message you do not understand, contact the site maintainer with:

- what you were editing,
- roughly when you saved it.

Nothing you can do in the CMS will take the website down, so there is no need
to worry about experimenting.

---

**Maintainer contact:** the current maintainer of
`TSRMethod/TSRmethod.github.io`. Issues can also be raised at
<https://github.com/TSRMethod/TSRmethod.github.io/issues>.
